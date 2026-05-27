"use client";

import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { PRODUCT_CATEGORIES, categoryLabel } from "@/interfaces/categories";
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
      .catch((err) => toast.error(getErrorMessage(err, "Failed to load shopping list")))
      .finally(() => setLoading(false));
  }, [activeFridgeId]);

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
      toast.error(getErrorMessage(err, "Failed to add item"));
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
      toast.error(getErrorMessage(err, "Failed to update item"));
    }
  };

  const handleDelete = async (id: number) => {
    const prev = items;
    setItems((items) => items.filter((i) => i.id !== id));
    try {
      await apiFetch(`/shopping/${id}`, { method: "DELETE" });
    } catch (err) {
      setItems(prev);
      toast.error(getErrorMessage(err, "Failed to delete item"));
    }
  };

  const handlePurchase = async (item: ShoppingItem) => {
    try {
      const product = await apiFetch<ProductResponse>(`/shopping/${item.id}/purchase`, {
        method: "POST",
        body: { expiryDate: null },
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(`"${product.name}" added to the fridge`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add to the fridge"));
    }
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div className="min-h-full w-full p-4 md:p-8 lg:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
            <ShoppingBasket className="h-3 w-3" />
            Shopping list
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">What to buy</h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            Plan ahead. Tap the cart icon to move a purchased item straight into your fridge.
          </p>
          <ActiveFridgeBanner icon={ShoppingBasket} label="Shopping list for" />
        </header>

        <Card className="rounded-3xl border-border/60 shadow-sm bg-card">
          <CardContent className="p-5 md:p-6">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5 space-y-2">
                <Label htmlFor="sh-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Item
                </Label>
                <Input
                  id="sh-name"
                  placeholder="e.g. Tomatoes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="sh-qty" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Qty
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
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unit</Label>
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
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-12">
                <Button type="submit" disabled={adding || !name.trim()} className="rounded-xl font-bold w-full md:w-auto">
                  {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add to list
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
              <h3 className="text-xl font-black tracking-tight">Your list is empty</h3>
              <p className="text-sm text-muted-foreground">Add the first item using the form above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <ShoppingItemGroup
              title={`To buy (${unchecked.length})`}
              items={unchecked}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onPurchase={handlePurchase}
            />
            {checked.length > 0 && (
              <ShoppingItemGroup
                title={`Got them (${checked.length})`}
                items={checked}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onPurchase={handlePurchase}
                muted
              />
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
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</h2>
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
                aria-label={item.checked ? "Mark as not bought" : "Mark as bought"}
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
                  {categoryLabel(item.category)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {!item.checked && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-lg gap-1.5"
                    onClick={() => onPurchase(item)}
                    title="Mark purchased and add to the fridge"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Buy
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(item.id)}
                  title="Remove from list"
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
