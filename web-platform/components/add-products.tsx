"use client";

import { useState } from "react";
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
import { Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useProductStore } from "@/store/useVFridgeStore";
import { productSchema } from "@/interfaces/schemas";
import { getErrorMessage } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/interfaces/categories";

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

  const reset = () => setFormData({ name: "", description: "", quantity: "1", unit: "pcs", expiryDate: "", category: "other" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You are not signed in. Try signing in again.");
      return;
    }

    if (formData.expiryDate) {
      const selectedDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        const confirmAdd = confirm("This product is already expired. Add anyway?");
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
      toast.error(validation.error.issues[0]?.message || "Validation error");
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
      toast.success(`"${savedProduct.name}" added`);
      setIsOpen(false);
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add the product"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-xl font-bold gap-2 shadow-md shadow-primary/20">
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="h-11 w-11 rounded-xl bg-secondary text-secondary-foreground grid place-items-center mb-2">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl tracking-tight">New product in the fridge</DialogTitle>
          <DialogDescription>Add a name, quantity, and expiry date.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Milk"
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
                Quantity
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
                Unit
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
              Category
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
                  <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Expiry date
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
              Description (optional)
            </Label>
            <Input
              id="description"
              placeholder="e.g. 2.5% fat"
              className="h-11 rounded-xl"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="rounded-xl"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl font-bold">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
