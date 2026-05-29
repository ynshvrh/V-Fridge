"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BrowserMultiFormatReader, type Result } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, Loader2, RefreshCw, ScanBarcode, X } from "lucide-react";
import { type ProductCategorySlug } from "@/interfaces/categories";

export type ScannedProduct = {
  barcode: string;
  name: string;
  category: ProductCategorySlug;
  unit: string;
  quantity: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onResolved: (product: ScannedProduct) => void;
};

const STORE_URL = "https://world.openfoodfacts.org/api/v0/product";

export function BarcodeScanner({ open, onClose, onResolved }: Props) {
  const t = useTranslations();
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="h-11 w-11 rounded-xl bg-secondary text-secondary-foreground grid place-items-center mb-2">
            <ScanBarcode className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl tracking-tight">{t("barcodeTitle")}</DialogTitle>
          <DialogDescription>
            {t("barcodeHint")}
          </DialogDescription>
        </DialogHeader>
        {open && <ScannerBody onClose={onClose} onResolved={onResolved} />}
      </DialogContent>
    </Dialog>
  );
}

function ScannerBody({
  onClose,
  onResolved,
}: {
  onClose: () => void;
  onResolved: (product: ScannedProduct) => void;
}) {
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lockedRef = useRef(false);
  const [status, setStatus] = useState<"scanning" | "lookup" | "error">("scanning");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    lockedRef.current = false;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromVideoDevice(null, videoRef.current!, async (result: Result | undefined, err) => {
        if (cancelled || lockedRef.current) return;
        // NotFoundException fires every frame the decoder can't find a barcode — ignore it.
        if (err && err.name !== "NotFoundException") return;
        if (!result) return;

        const text = result.getText();
        if (!text || !/^[0-9]{6,14}$/.test(text)) return;

        lockedRef.current = true;
        reader.reset();
        setStatus("lookup");

        try {
          const product = await lookupOpenFoodFacts(text);
          if (cancelled) return;
          if (!product) {
            setStatus("error");
            setErrorMessage(t("barcodeNotFound"));
            return;
          }
          onResolved(product);
          onClose();
        } catch (e) {
          if (cancelled) return;
          setStatus("error");
          setErrorMessage(e instanceof Error ? e.message : t("barcodeLookupFailed"));
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error && err.name === "NotAllowedError"
            ? t("barcodeCameraBlocked")
            : err instanceof Error
              ? err.message
              : t("barcodeCameraFailed"),
        );
      });

    return () => {
      cancelled = true;
      readerRef.current?.reset();
      readerRef.current = null;
    };
  }, [retryNonce, onClose, onResolved, t]);

  const retry = () => {
    setErrorMessage(null);
    setStatus("scanning");
    setRetryNonce((n) => n + 1);
  };

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[4/3]">
        <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
        {status === "lookup" && (
          <div className="absolute inset-0 grid place-items-center bg-background/80">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm font-medium">{t("barcodeLookingUp")}</span>
            </div>
          </div>
        )}
        {status === "scanning" && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 text-xs font-medium flex items-center gap-1.5">
            <Camera className="h-3 w-3" /> {t("barcodeScanning")}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive flex items-start gap-2">
          <X className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      <div className="flex justify-between gap-2 pt-1">
        <Button variant="ghost" onClick={onClose} className="rounded-xl">{t("actionCancel")}</Button>
        {status === "error" && (
          <Button onClick={retry} className="rounded-xl gap-2">
            <RefreshCw className="h-4 w-4" /> {t("actionRetry")}
          </Button>
        )}
      </div>
    </>
  );
}

async function lookupOpenFoodFacts(barcode: string): Promise<ScannedProduct | null> {
  const res = await fetch(`${STORE_URL}/${encodeURIComponent(barcode)}.json`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`OpenFoodFacts request failed (${res.status})`);
  }
  const data = (await res.json()) as { status: number; product?: OffProduct };
  if (data.status !== 1 || !data.product) return null;
  return mapOffToScanned(barcode, data.product);
}

type OffProduct = {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  categories_tags?: string[];
  quantity?: string;
};

function mapOffToScanned(barcode: string, p: OffProduct): ScannedProduct {
  const name = (p.product_name_en || p.product_name || p.brands || "Unknown product").trim();
  const category = mapCategoryTagsToSlug(p.categories_tags ?? []);
  const { quantity, unit } = parseQuantity(p.quantity);
  return { barcode, name, category, unit, quantity };
}

const TAG_PATTERNS: { regex: RegExp; slug: ProductCategorySlug }[] = [
  { regex: /(milk|cheese|yogurt|butter|cream|dairy)/, slug: "dairy" },
  { regex: /(meat|fish|seafood|sausage|poultry|beef|pork|chicken)/, slug: "meat-fish" },
  { regex: /(vegetable|salad|herb|mushroom|green)/, slug: "vegetables" },
  { regex: /(fruit|berry|berries|apple|banana|orange)/, slug: "fruits" },
  { regex: /(bread|bakery|pastry|bun|cake|cookie)/, slug: "bakery" },
  { regex: /(pasta|grain|rice|flour|sugar|salt|cereal|oat)/, slug: "pantry" },
  { regex: /(chip|snack|sweet|chocolate|candy|nut)/, slug: "snacks" },
  { regex: /(water|juice|soda|coffee|tea|drink|beverage)/, slug: "drinks" },
  { regex: /(beer|wine|spirit|alcohol|liqueur|vodka)/, slug: "alcohol" },
  { regex: /(oil|vinegar|sauce|ketchup|mayo|spice|condiment)/, slug: "sauces" },
  { regex: /(frozen|ice-cream)/, slug: "frozen" },
  { regex: /(canned|preserve|ready-to-eat|ready-meal)/, slug: "canned-prepared" },
];

function mapCategoryTagsToSlug(tags: string[]): ProductCategorySlug {
  const flat = tags.join(" ").toLowerCase();
  for (const { regex, slug } of TAG_PATTERNS) if (regex.test(flat)) return slug;
  return "other";
}

function parseQuantity(raw: string | undefined): { quantity: string; unit: string } {
  if (!raw) return { quantity: "1", unit: "pcs" };
  const m = raw.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl)\b/i);
  if (!m) return { quantity: "1", unit: "pcs" };
  let quantity = m[1].replace(",", ".");
  let unit = m[2].toLowerCase();
  if (unit === "cl") {
    quantity = (parseFloat(quantity) * 10).toString();
    unit = "ml";
  }
  return { quantity, unit };
}
