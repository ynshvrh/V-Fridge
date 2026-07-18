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

export interface ShoppingItem {
  id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  checked: boolean;
  createdAt: string | null;
}

interface ShoppingState {
  items: ShoppingItem[];
  setItems: (items: ShoppingItem[]) => void;
  addItem: (item: ShoppingItem) => void;
  toggleItem: (id: number, checked: boolean) => void;
  removeItem: (id: number) => void;
}

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: (item) => set((state) => ({
        items: [...state.items, item],
      })),
      toggleItem: (id, checked) => set((state) => ({
        items: state.items.map((item) => item.id === id ? { ...item, checked } : item),
      })),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),
    }),
    {
      name: 'vfridge-shopping-storage',
    }
  )
);

export interface DailyNutritionResponse {
  date: string;
  targets: {
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  };
  summary: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  logs: {
    id: number;
    mealType: string;
    foodName: string;
    quantity: number | null;
    unit: string | null;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    loggedAt: string;
  }[];
}

interface NutritionState {
  dailyCache: Record<string, DailyNutritionResponse>;
  setDailyData: (date: string, data: DailyNutritionResponse) => void;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set) => ({
      dailyCache: {},
      setDailyData: (date, data) => set((state) => ({
        dailyCache: {
          ...state.dailyCache,
          [date]: data,
        },
      })),
    }),
    {
      name: 'vfridge-nutrition-storage',
    }
  )
);

export interface Meal {
  name: string;
  day: string;
  ingredients: string[];
  note: string | null;
  description: string | null;
  steps: string[] | null;
  mealType: string | null;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

export interface GapItem {
  name: string;
  quantity: string | null;
  unit: string | null;
  category: string;
}

export interface MealPlan {
  meals: Meal[];
  gapItems: GapItem[];
  generatedAt: string;
}

interface PlannerState {
  plan: MealPlan | null;
  setPlan: (plan: MealPlan | null) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      plan: null,
      setPlan: (plan) => set({ plan }),
    }),
    {
      name: 'vfridge-planner-storage',
    }
  )
);
