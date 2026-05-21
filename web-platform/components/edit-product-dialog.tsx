"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useProductStore } from "@/store/useVFridgeStore";
import { getErrorMessage } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/interfaces/categories";
import type { Product } from "@/interfaces/type";

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

type Props = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const UNITS = ["pcs", "kg", "g", "l", "ml"];

/** Picks the slug from the product if it's in our catalog, otherwise falls back to "other". */
function safeCategory(slug: string | null | undefined): string {
  if (!slug) return "other";
  return PRODUCT_CATEGORIES.some((c) => c.slug === slug) ? slug : "other";
}

function safeUnit(unit: string | null | undefined): string {
  if (!unit) return "pcs";
  return UNITS.includes(unit) ? unit : "pcs";
}

function expiryToInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function EditProductDialog({ product, open, onOpenChange }: Props) {
  const updateProduct = useProductStore((s) => s.updateProduct);
  const removeProduct = useProductStore((s) => s.removeProduct);

  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description ?? "",
    quantity: String(product.quantity),
    unit: safeUnit(product.unit),
    expiryDate: expiryToInputValue(product.expiryDate),
    category: safeCategory(product.category),
  });
  const [isLoading, setIsLoading] = useState(false);

  // Re-sync when the parent swaps the product (or reopens with a different one).
  useEffect(() => {
    if (!open) return;
    setFormData({
      name: product.name,
      description: product.description ?? "",
      quantity: String(product.quantity),
      unit: safeUnit(product.unit),
      expiryDate: expiryToInputValue(product.expiryDate),
      category: safeCategory(product.category),
    });
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    if (trimmedName.length < 2) {
      toast.error("Name is too short");
      return;
    }
    const qty = Number(formData.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setIsLoading(true);

    // Only send fields that actually changed compared to the loaded product.
    const body: Record<string, unknown> = {};
    if (trimmedName !== product.name) body.name = trimmedName;
    const newDescription = formData.description.trim() || null;
    const oldDescription = product.description ?? null;
    if (newDescription !== oldDescription) body.description = newDescription;
    if (qty !== product.quantity) body.quantity = qty;
    if (formData.unit !== product.unit) body.unit = formData.unit;
    if (formData.category !== product.category) body.category = formData.category;
    const newExpiry = formData.expiryDate || null;
    const oldExpiry = expiryToInputValue(product.expiryDate) || null;
    if (newExpiry !== oldExpiry) body.expiryDate = newExpiry;

    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      setIsLoading(false);
      return;
    }

    try {
      const updated = await apiFetch<ProductResponse | { success: true; removed: true }>(
        `/products/${product.id}`,
        { method: "PATCH", body },
      );

      if ("removed" in updated && updated.removed) {
        removeProduct(product.id);
        toast.success(`"${product.name}" finished — logged`);
      } else {
        const u = updated as ProductResponse;
        updateProduct({ ...u, ownerId: String(u.ownerId) });
        toast.success("Product updated");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update the product"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="h-11 w-11 rounded-xl bg-secondary text-secondary-foreground grid place-items-center mb-2">
            <Pencil className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl tracking-tight">Edit product</DialogTitle>
          <DialogDescription>Change name, quantity, unit, category, or expiry date.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Name
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-quantity" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Quantity
              </Label>
              <Input
                id="edit-quantity"
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
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => setFormData({ ...formData, unit: v })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
            >
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

          <div className="space-y-2">
            <Label htmlFor="edit-expiryDate" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Expiry date
            </Label>
            <Input
              id="edit-expiryDate"
              type="date"
              className="h-11 rounded-xl"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Description (optional)
            </Label>
            <Input
              id="edit-description"
              className="h-11 rounded-xl"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl font-bold">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
