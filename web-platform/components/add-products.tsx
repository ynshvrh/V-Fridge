"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { apiFetch } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ScanBarcode, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useProductStore } from "@/store/useVFridgeStore";
import { productSchema } from "@/interfaces/schemas";
import { getErrorMessage } from "@/lib/utils";
import { PRODUCT_CATEGORIES, categoryLabelKey } from "@/interfaces/categories";
import { BarcodeScanner, type ScannedProduct } from "@/components/barcode-scanner";

type ProductResponse = {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  expiryDate: string | null;
  category: string;
  ownerId: number;
  createdAt: string;
};

export function AddProducts() {
  const t = useTranslations();
  const { user } = useAuth();
  const addProductToStore = useProductStore((state) => state.addProduct);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "1",
    unit: "pcs",
    expiryDate: "",
    category: "other",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const reset = () => setFormData({ name: "", description: "", quantity: "1", unit: "pcs", expiryDate: "", category: "other" });

  // Advisory only — never blocks submission. Incomplete or "other"-category
  // products make the AI chef guess, which has produced wrong suggestions
  // (e.g. a scanned beer saved as a berry, prompting a blueberry-pie recipe).
  const hasIncompleteData =
    !formData.category ||
    formData.category === "other" ||
    !formData.quantity.trim() ||
    Number(formData.quantity) <= 0 ||
    !formData.expiryDate;

  const applyScanned = (p: ScannedProduct) => {
    setFormData((prev) => ({
      ...prev,
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
      category: p.category,
    }));
    toast.success(t("addProductFilledFromBarcode", { barcode: p.barcode }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t("addProductNotSignedIn"));
      return;
    }

    if (formData.expiryDate) {
      const selectedDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        const confirmAdd = confirm(t("addProductExpiredConfirm"));
        if (!confirmAdd) return;
      }
    }

    setIsLoading(true);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      expiryDate: formData.expiryDate,
      category: formData.category,
      ownerId: String(user.id),
    };

    const validation = productSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || t("addProductValidation"));
      setIsLoading(false);
      return;
    }

    try {
      const savedProduct = await apiFetch<ProductResponse>("/products", {
        method: "POST",
        body: {
          name: payload.name,
          description: payload.description,
          quantity: payload.quantity,
          unit: payload.unit,
          expiryDate: payload.expiryDate || null,
          category: payload.category,
        },
      });
      addProductToStore({ ...savedProduct, ownerId: String(savedProduct.ownerId) });
      toast.success(t("addProductAddedToast", { name: savedProduct.name }));
      setIsOpen(false);
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error, t("addProductAddFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-xl font-bold gap-2 shadow-md shadow-primary/20">
          <Plus className="h-4 w-4" />
          {t("dashboardAddProduct")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="h-11 w-11 rounded-xl bg-secondary text-secondary-foreground grid place-items-center mb-2">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl tracking-tight">{t("addProductDialogTitle")}</DialogTitle>
          <DialogDescription>{t("addProductDialogBody")}</DialogDescription>
        </DialogHeader>
        <Button
          type="button"
          variant="outline"
          onClick={() => setScannerOpen(true)}
          className="w-full rounded-xl gap-2 mt-1"
        >
          <ScanBarcode className="h-4 w-4" />
          {t("addProductScanBarcode")}
        </Button>
        <BarcodeScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onResolved={applyScanned}
        />
        <form onSubmit={handleAdd} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("addProductName")}
            </Label>
            <Input
              id="name"
              placeholder={t("addProductNamePlaceholder")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="quantity" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("addProductQuantity")}
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0"
                className="h-11 rounded-xl"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("addProductUnit")}
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => setFormData({ ...formData, unit: v })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("addProductCategory")}
            </Label>
            <Select
              value={formData.category}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>{t(categoryLabelKey(c.slug))}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("addProductExpiry")}
            </Label>
            <Input
              id="expiryDate"
              type="date"
              className="h-11 rounded-xl"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("addProductDescriptionLabel")}
            </Label>
            <Input
              id="description"
              placeholder={t("addProductDescriptionPlaceholder")}
              className="h-11 rounded-xl"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {hasIncompleteData && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-900 dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-200"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t("productIncompleteWarning")}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="rounded-xl"
              disabled={isLoading}
            >
              {t("actionCancel")}
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl font-bold">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("actionAdd")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
