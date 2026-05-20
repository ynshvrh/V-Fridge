"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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

export function AddProducts() {
  const { data: session } = useSession();
  const addProductToStore = useProductStore((state) => state.addProduct);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "1",
    unit: "шт",
    expiryDate: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const reset = () => setFormData({ name: "", description: "", quantity: "1", unit: "шт", expiryDate: "" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast.error("Ви не авторизовані. Спробуйте перелогінитись.");
      return;
    }

    if (formData.expiryDate) {
      const selectedDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        const confirmAdd = confirm("⚠️ Продукт вже протермінований. Додати все одно?");
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
      ownerId: String(session.user.id),
    };

    const validation = productSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Помилка валідації");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server error");
      }

      const savedProduct = await response.json();
      addProductToStore(savedProduct);
      toast.success(`«${savedProduct.name}» додано`);
      setIsOpen(false);
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не вдалося додати продукт"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-xl font-bold gap-2 shadow-md shadow-primary/20">
          <Plus className="h-4 w-4" />
          Додати продукт
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="h-11 w-11 rounded-xl bg-secondary text-secondary-foreground grid place-items-center mb-2">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl tracking-tight">Новий продукт у холодильник</DialogTitle>
          <DialogDescription>Додайте назву, кількість і дату придатності.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Назва
            </Label>
            <Input
              id="name"
              placeholder="Наприклад: Молоко"
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
                Кількість
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
                Од.
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => setFormData({ ...formData, unit: v })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="шт">шт</SelectItem>
                  <SelectItem value="кг">кг</SelectItem>
                  <SelectItem value="г">г</SelectItem>
                  <SelectItem value="л">л</SelectItem>
                  <SelectItem value="мл">мл</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Термін придатності
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
              Опис (необов'язково)
            </Label>
            <Input
              id="description"
              placeholder="Наприклад: 2.5% жирності"
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
              Скасувати
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl font-bold">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Додати
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
