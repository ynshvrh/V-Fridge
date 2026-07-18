import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/interfaces/type';

interface ProductState {
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  removeProduct: (id: number) => void;
  updateProduct: (updated: Product) => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      products: [],

      setProducts: (products) => set({ products }),

      addProduct: (product) => set((state) => ({
        products: [...state.products, product]
      })),

      removeProduct: (id: number) => set((state) => ({
        products: state.products.filter((p) => p.id !== id)
      })),

      updateProduct: (updated: Product) => set((state) => ({
        products: state.products.map((p) => (p.id === updated.id ? updated : p))
      })),
    }),
    {
      name: 'vfridge-products-storage',
    }
  )
);
