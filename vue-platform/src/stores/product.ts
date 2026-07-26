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

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchProducts() {
    loading.value = true;
    error.value = null;
    try {
      products.value = await api.fetch<Product[]>('/products');
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to load products';
    } finally {
      loading.value = false;
    }
  }

  async function addProduct(input: CreateProductInput): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const created = await api.fetch<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(input)
      });
      products.value.push(created);
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
    deleteProduct,
    deleteAllProducts
  };
});
