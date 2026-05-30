"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ShoppingBasket, Loader2, Trash2, Check, Square, CheckSquare } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { PRODUCT_CATEGORIES, categoryLabelKey } from "@/interfaces/categories";
import { useFridges } from "@/providers/fridge-provider";
import { ActiveFridgeBanner } from "@/components/active-fridge-banner";

type ShoppingItem = {
  id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  checked: boolean;
  createdAt: string | null;
};

type ProductResponse = {
  id: number;
  name: string;
};

export default function ShoppingPage() {
  const t = useTranslations();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [category, setCategory] = useState("other");
  const [adding, setAdding] = useState(false);

  const activeFridgeId = useFridges().active?.id ?? null;

  useEffect(() => {
    setLoading(true);
    apiFetch<ShoppingItem[]>("/shopping")
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(getErrorMessage(err, t("shoppingLoadFailed"))))
      .finally(() => setLoading(false));
  }, [activeFridgeId, t]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const created = await apiFetch<ShoppingItem>("/shopping", {
        method: "POST",
        body: {
          name: name.trim(),
          quantity: Number(quantity) || null,
          unit,
          category,
        },
      });
      setItems((prev) => [...prev, created]);
      setName("");
      setQuantity("1");
    } catch (err) {
      toast.error(getErrorMessage(err, t("shoppingAddFailed")));
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    const next = !item.checked;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: next } : i)));
    try {
      await apiFetch(`/shopping/${item.id}`, { method: "PATCH", body: { checked: next } });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: !next } : i)));
      toast.error(getErrorMessage(err, t("shoppingUpdateFailed")));
    }
  };

  const handleDelete = async (id: number) => {
    const prev = items;
    setItems((items) => items.filter((i) => i.id !== id));
    try {
      await apiFetch(`/shopping/${id}`, { method: "DELETE" });
    } catch (err) {
      setItems(prev);
      toast.error(getErrorMessage(err, t("shoppingDeleteFailed")));
    }
  };

  const handlePurchase = async (item: ShoppingItem) => {
    try {
      const product = await apiFetch<ProductResponse>(`/shopping/${item.id}/purchase`, {
        method: "POST",
        body: { expiryDate: null },
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(t("shoppingAddedToFridge", { name: product.name }));
    } catch (err) {
      toast.error(getErrorMessage(err, t("shoppingPurchaseFailed")));
    }
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  // Group the still-to-buy items by category, ordered by the canonical catalog
  // order so headers stay stable regardless of insertion order. Bought items
  // keep their own flat "Got them" group below.
  const uncheckedGroups = useMemo(() => {
    const byCategory = new Map<string, ShoppingItem[]>();
    for (const item of unchecked) {
      const slug = PRODUCT_CATEGORIES.some((c) => c.slug === item.category) ? item.category : "other";
      const bucket = byCategory.get(slug);
      if (bucket) bucket.push(item);
      else byCategory.set(slug, [item]);
    }
    return PRODUCT_CATEGORIES
      .filter((c) => byCategory.has(c.slug))
      .map((c) => ({ category: c.slug, items: byCategory.get(c.slug)! }));
  }, [unchecked]);

  return (
    <div className="min-h-full w-full p-4 md:p-8 lg:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
            <ShoppingBasket className="h-3 w-3" />
            {t("shoppingTitle")}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{t("shoppingHeroTitle")}</h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            {t("shoppingHeroSubtitle")}
          </p>
          <ActiveFridgeBanner icon={ShoppingBasket} label={t("shoppingActiveFor")} />
        </header>

        <Card className="rounded-3xl border-border/60 shadow-sm bg-card">
          <CardContent className="p-5 md:p-6">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5 space-y-2">
                <Label htmlFor="sh-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("shoppingFieldItem")}
                </Label>
                <Input
                  id="sh-name"
                  placeholder={t("shoppingFieldItemPlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="sh-qty" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("shoppingFieldQty")}
                </Label>
                <Input
                  id="sh-qty"
                  type="number"
                  step="0.1"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("addProductUnit")}</Label>
                <Select value={unit} onValueChange={setUnit}>
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
              <div className="md:col-span-3 space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("addProductCategory")}</Label>
                <Select value={category} onValueChange={setCategory}>
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
              <div className="md:col-span-12">
                <Button type="submit" disabled={adding || !name.trim()} className="rounded-xl font-bold w-full md:w-auto">
                  {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  {t("shoppingAddToList")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card className="rounded-3xl border-2 border-dashed border-border bg-muted/20">
            <CardContent className="py-16 text-center space-y-3">
              <ShoppingBasket className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-black tracking-tight">{t("shoppingEmpty")}</h3>
              <p className="text-sm text-muted-foreground">{t("shoppingEmptyHint")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {unchecked.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {`${t("shoppingToBuy")} (${unchecked.length})`}
                </h2>
                <div className="space-y-5">
                  {uncheckedGroups.map((group) => (
                    <ShoppingItemGroup
                      key={group.category}
                      title={t(categoryLabelKey(group.category))}
                      items={group.items}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              </section>
            )}
            {checked.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {`${t("shoppingGotThem")} (${checked.length})`}
                </h2>
                <ShoppingItemGroup
                  title=""
                  items={checked}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onPurchase={handlePurchase}
                  muted
                />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ShoppingItemGroup({
  title,
  items,
  onToggle,
  onDelete,
  onPurchase,
  muted = false,
}: {
  title: string;
  items: ShoppingItem[];
  onToggle: (i: ShoppingItem) => void;
  onDelete: (id: number) => void;
  onPurchase: (i: ShoppingItem) => void;
  muted?: boolean;
}) {
  const t = useTranslations();
  return (
    <section className="space-y-2">
      {title && (
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 px-1">{title}</h3>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className={`rounded-2xl border-border/70 shadow-sm transition-colors ${muted ? "opacity-60" : ""}`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <button
                type="button"
                onClick={() => onToggle(item)}
                aria-label={item.checked ? t("shoppingAriaUncheck") : t("shoppingAriaCheck")}
                aria-pressed={item.checked}
                className="text-primary hover:text-primary/80"
              >
                {item.checked
                  ? <CheckSquare className="h-5 w-5" />
                  : <Square className="h-5 w-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate ${item.checked ? "line-through" : ""}`}>{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity != null ? `${item.quantity} ${item.unit ?? ""} · ` : ""}
                  {t(categoryLabelKey(item.category))}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {!item.checked && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-lg gap-1.5"
                    onClick={() => onPurchase(item)}
                    title={t("shoppingMoveToFridge")}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {t("shoppingBuyShort")}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(item.id)}
                  title={t("actionDelete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
