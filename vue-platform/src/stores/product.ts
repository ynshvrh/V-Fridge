import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, type ApiErrorResponse } from '@/api/client';

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  quantity: number;
  unit: string;
  expiryDate?: string | null;
  category: string;
  ownerId: number;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  category?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  expiryDate?: string | null;
  category?: string;
}

export interface CookIngredientItem {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface CookRecipeInput {
  name: string;
  description?: string | null;
  portions?: number;
  structuredIngredients?: CookIngredientItem[];
  ingredients?: string[];
  caloriesPerPortion?: number;
  proteinPerPortion?: number;
  fatPerPortion?: number;
  carbsPerPortion?: number;
  expiryDays?: number;
  savedRecipeId?: number;
  ignoreOptionalMissing?: boolean;
}

export interface DeductedIngredientSummary {
  rawIngredient: string;
  matchedProductName: string;
  deductedQuantity: number;
  unit: string;
  fullyConsumed: boolean;
}

export interface CookRecipeResult {
  preparedMealProduct: Product;
  deductions: DeductedIngredientSummary[];
  message: string;
}

export interface ConsumeProductInput {
  portions?: number;
  mealType?: string;
  date?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

export interface ConsumeProductResult {
  productRemoved: boolean;
  remainingQuantity: number;
  nutritionLogId?: number;
  message: string;
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchProducts(silent = false) {
    if (!silent) loading.value = true;
    error.value = null;
    try {
      products.value = await api.fetch<Product[]>('/products');
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to load products';
    } finally {
      if (!silent) loading.value = false;
    }
  }

  async function addProduct(input: CreateProductInput): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await api.fetch<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(input)
      });
      await fetchProducts(true);
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to add product';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateProduct(id: number, input: UpdateProductInput): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const updated = await api.fetch<Product>(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input)
      });
      const index = products.value.findIndex(p => p.id === id);
      if (index !== -1) {
        products.value[index] = updated;
      }
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to update product';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function cookRecipe(input: CookRecipeInput): Promise<CookRecipeResult | null> {
    loading.value = true;
    error.value = null;
    try {
      const result = await api.fetch<CookRecipeResult>('/products/cook', {
        method: 'POST',
        body: JSON.stringify(input)
      });
      await fetchProducts(true);
      return result;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to cook recipe';
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function consumeProduct(id: number, input: ConsumeProductInput = {}): Promise<ConsumeProductResult | null> {
    loading.value = true;
    error.value = null;
    try {
      const result = await api.fetch<ConsumeProductResult>(`/products/${id}/consume`, {
        method: 'POST',
        body: JSON.stringify(input)
      });
      if (result.productRemoved) {
        products.value = products.value.filter(p => p.id !== id);
      } else {
        const index = products.value.findIndex(p => p.id === id);
        if (index !== -1) {
          products.value[index].quantity = result.remainingQuantity;
        }
      }
      return result;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to consume portion';
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProduct(id: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await api.fetch(`/products/${id}`, { method: 'DELETE' });
      products.value = products.value.filter(p => p.id !== id);
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to delete product';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAllProducts(): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await api.fetch('/products', { method: 'DELETE' });
      products.value = [];
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to empty fridge';
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    cookRecipe,
    consumeProduct,
    deleteProduct,
    deleteAllProducts
  };
});
