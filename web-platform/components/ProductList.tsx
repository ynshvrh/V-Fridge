"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useProductStore } from "@/store/useVFridgeStore";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Trash2,
  Edit2,
  Loader2,
  Refrigerator,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import { categoryLabelKey } from "@/interfaces/categories";
import { useFridges } from "@/providers/fridge-provider";
import { EditProductDialog } from "@/components/edit-product-dialog";
import type { Product } from "@/interfaces/type";

type FreshnessTone = "none" | "expired" | "soon" | "fresh";

type FreshnessState = {
  tone: FreshnessTone;
  daysLeft?: number;
  className: string;
  ringClass?: string;
  icon?: React.ReactNode;
};

function getFreshness(date: string | Date | null | undefined): FreshnessState {
  if (!date) {
    return { tone: "none", className: "bg-muted text-muted-foreground border-border" };
  }
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      tone: "expired",
      className: "bg-destructive text-white border-destructive",
      ringClass: "ring-2 ring-destructive/40",
      icon: <AlertTriangle className="h-3 w-3" />,
    };
  }
  if (diffDays <= 3) {
    return {
      tone: "soon",
      daysLeft: diffDays,
      className: "bg-solara/20 text-foreground border-solara/50 dark:bg-solara/15 dark:border-solara/40",
      ringClass: "ring-1 ring-solara/40",
    };
  }
  return {
    tone: "fresh",
    className: "bg-secondary text-secondary-foreground border-secondary",
  };
}

export function ProductList() {
  const t = useTranslations();
  const { products, setProducts, removeProduct } = useProductStore();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const activeFridgeId = useFridges().active?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await apiFetch<Array<{ id: number; ownerId: number } & Record<string, unknown>>>("/products");
        if (!cancelled) setProducts(data.map((p) => ({ ...p, ownerId: String(p.ownerId) })) as never);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProducts();
    return () => { cancelled = true; };
  }, [setProducts, activeFridgeId]);

  const handleDelete = async (id: number) => {
    if (!confirm(t("productDeleteConfirm"))) return;

    try {
      await apiFetch(`/products/${id}`, { method: "DELETE" });
      removeProduct(id);
      toast.success(t("productDeletedToast"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("productDeleteFailed")));
    }
  };

  const freshnessLabel = (state: FreshnessState): string => {
    switch (state.tone) {
      case "none": return t("productNoDate");
      case "expired": return t("productExpiredShort");
      case "soon": return t("productDaysLeft", { count: state.daysLeft ?? 0 });
      case "fresh": return t("productFresh");
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
          {t("productListLoading")}
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
        <h3 className="text-xl font-black tracking-tight">{t("dashboardEmptyTitle")}</h3>
        <p className="text-muted-foreground max-w-xs mx-auto mt-2 text-sm">
          {t("dashboardEmptyBodyChef")}
        </p>
      </div>
    );
  }

  return (
    <>
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          className={`rounded-full px-2.5 py-0 h-5 text-[10px] uppercase font-black tracking-widest gap-1 border ${fresh.className}`}
                        >
                          {fresh.icon}
                          {freshnessLabel(fresh)}
                        </Badge>
                        <Badge className="rounded-full px-2.5 py-0 h-5 text-[10px] font-bold tracking-wide gap-1 border bg-muted/60 text-muted-foreground border-border">
                          {t(categoryLabelKey(product.category))}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={() => handleDelete(product.id)}
                      title={t("actionDelete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <p className="text-xs font-semibold">
                      {product.expiryDate
                        ? new Date(product.expiryDate).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : t("productNoDate")}
                    </p>
                  </div>

                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed bg-muted/40 p-2.5 rounded-lg italic">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/60">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                      {t("addProductQuantity")}
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
                    onClick={() => setEditing(product)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    {t("actionEdit")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editing && (
        <EditProductDialog
          product={editing}
          open={!!editing}
          onOpenChange={(open) => { if (!open) setEditing(null); }}
        />
      )}
    </>
  );
}
