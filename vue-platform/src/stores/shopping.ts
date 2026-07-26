import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, type ApiErrorResponse } from '@/api/client';
import { useProductStore } from './product';

export interface ShoppingItem {
  id: number;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  category: string;
  checked: boolean;
  createdAt: string;
}

export interface CreateShoppingItemInput {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
}

export interface UpdateShoppingItemInput {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  checked?: boolean;
}

export const useShoppingStore = defineStore('shopping', () => {
  const items = ref<ShoppingItem[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const uncheckedItems = computed(() => items.value.filter(i => !i.checked));
  const checkedItems = computed(() => items.value.filter(i => i.checked));

  async function fetchShoppingItems() {
    loading.value = true;
    error.value = null;
    try {
      items.value = await api.fetch<ShoppingItem[]>('/shopping');
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to load shopping list';
    } finally {
      loading.value = false;
    }
  }

  async function addItem(input: CreateShoppingItemInput): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const created = await api.fetch<ShoppingItem>('/shopping', {
        method: 'POST',
        body: JSON.stringify(input)
      });
      items.value.unshift(created);
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to add shopping item';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateItem(id: number, input: UpdateShoppingItemInput): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const updated = await api.fetch<ShoppingItem>(`/shopping/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input)
      });
      const index = items.value.findIndex(i => i.id === id);
      if (index !== -1) {
        items.value[index] = updated;
      }
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to update shopping item';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function toggleCheck(id: number, checked: boolean): Promise<boolean> {
    return await updateItem(id, { checked });
  }

  async function deleteItem(id: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await api.fetch(`/shopping/${id}`, { method: 'DELETE' });
      items.value = items.value.filter(i => i.id !== id);
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to delete item';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function purchaseItem(id: number, expiryDate?: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await api.fetch(`/shopping/${id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ expiryDate })
      });
      items.value = items.value.filter(i => i.id !== id);
      const productStore = useProductStore();
      await productStore.fetchProducts();
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to purchase item';
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    uncheckedItems,
    checkedItems,
    loading,
    error,
    fetchShoppingItems,
    addItem,
    updateItem,
    toggleCheck,
    deleteItem,
    purchaseItem
  };
});
