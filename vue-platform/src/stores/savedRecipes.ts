import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';

export interface SavedRecipe {
  id: number;
  name: string;
  description: string | null;
  ingredients: string[];
  steps: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  createdAt: string;
}

export interface SaveRecipePayload {
  name: string;
  description?: string | null;
  ingredients?: string[];
  steps?: string[];
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

export const useSavedRecipeStore = defineStore('savedRecipes', () => {
  const savedRecipes = ref<SavedRecipe[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSavedRecipes() {
    loading.value = true;
    error.value = null;
    try {
      const list = await api.fetch<SavedRecipe[]>('/saved-recipes');
      savedRecipes.value = Array.isArray(list) ? list : [];
      return savedRecipes.value;
    } catch (err: any) {
      error.value = err.error || err.message || 'Помилка завантаження збережених рецептів';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function saveRecipe(payload: SaveRecipePayload) {
    try {
      const saved = await api.fetch<SavedRecipe>('/saved-recipes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      // Update local list
      const index = savedRecipes.value.findIndex(r => r.id === saved.id);
      if (index !== -1) {
        savedRecipes.value[index] = saved;
      } else {
        savedRecipes.value.unshift(saved);
      }
      return saved;
    } catch (err: any) {
      error.value = err.error || err.message || 'Помилка збереження рецепта';
      throw err;
    }
  }

  async function deleteSavedRecipe(id: number) {
    try {
      await api.fetch(`/saved-recipes/${id}`, {
        method: 'DELETE'
      });
      savedRecipes.value = savedRecipes.value.filter(r => r.id !== id);
    } catch (err: any) {
      error.value = err.error || err.message || 'Помилка вилучення рецепта';
      throw err;
    }
  }

  return {
    savedRecipes,
    loading,
    error,
    fetchSavedRecipes,
    saveRecipe,
    deleteSavedRecipe
  };
});
