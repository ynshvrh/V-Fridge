"use client";

import { useEffect, useState } from "react";
import { useProductStore } from "@/store/useVFridgeStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Refrigerator,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

type FreshnessState = {
  label: string;
  className: string;
  ringClass?: string;
  icon?: React.ReactNode;
};

function getFreshness(date: string | Date | null | undefined): FreshnessState {
  if (!date) {
    return { label: "Без дати", className: "bg-muted text-muted-foreground border-border" };
  }
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: "Прострочено",
      className: "bg-destructive text-white border-destructive",
      ringClass: "ring-2 ring-destructive/40",
      icon: <AlertTriangle className="h-3 w-3" />,
    };
  }
  if (diffDays <= 3) {
    return {
      label: `${diffDays} ${diffDays === 1 ? "день" : "дні"}`,
      className: "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-700/60",
      ringClass: "ring-1 ring-yellow-400/40",
    };
  }
  return {
    label: "Свіжий",
    className: "bg-secondary text-secondary-foreground border-secondary",
  };
}

export function ProductList() {
  const { products, setProducts, removeProduct, updateProduct } = useProductStore();
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Помилка завантаження продуктів:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [setProducts]);

  const handleDelete = async (id: number) => {
    if (!confirm("Видалити цей продукт?")) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        removeProduct(id);
        toast.success("Продукт видалено");
      } else {
        toast.error("Не вдалося видалити продукт");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveQty = async (id: number) => {
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity: Number(editValue) }),
      });

      if (res.ok) {
        const updated = await res.json();
        updateProduct(updated);
        setEditingId(null);
        toast.success("Кількість оновлено");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary/30" />
          <Refrigerator className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Заглядаємо в холодильник…
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/20">
        <div className="bg-secondary w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <Refrigerator className="h-10 w-10 text-secondary-foreground" />
        </div>
        <h3 className="text-xl font-black tracking-tight">Холодильник порожній</h3>
        <p className="text-muted-foreground max-w-xs mx-auto mt-2 text-sm">
          Час додати перші продукти — потім AI-кухар запропонує рецепти.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
      {products.map((product) => {
        const fresh = getFreshness(product.expiryDate);

        return (
          <Card
            key={product.id}
            className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 border border-border/70 bg-card shadow-sm rounded-2xl ${fresh.ringClass ?? ""}`}
          >
            <CardContent className="p-5 flex flex-col h-full justify-between gap-5">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-black text-lg tracking-tight line-clamp-1">{product.name}</h3>
                    <Badge
                      className={`rounded-full px-2.5 py-0 h-5 text-[10px] uppercase font-black tracking-widest gap-1 border ${fresh.className}`}
                    >
                      {fresh.icon}
                      {fresh.label}
                    </Badge>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive shrink-0"
                    onClick={() => handleDelete(product.id)}
                    title="Видалити"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <p className="text-xs font-semibold">
                    {product.expiryDate
                      ? new Date(product.expiryDate).toLocaleDateString("uk-UA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Без дати"}
                  </p>
                </div>

                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed bg-muted/40 p-2.5 rounded-lg italic">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/60">
                {editingId === product.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      type="number"
                      step="0.1"
                      className="h-10 border-primary/40 focus-visible:ring-primary font-bold"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                    />
                    <Button size="icon" className="h-10 w-10 shrink-0" onClick={() => handleSaveQty(product.id)}>
                      <Check className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 shrink-0"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                        Кількість
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black tracking-tight">{product.quantity}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase">{product.unit}</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-xl font-semibold h-10 px-4 gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        setEditingId(product.id);
                        setEditValue(String(product.quantity));
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Редагувати
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
