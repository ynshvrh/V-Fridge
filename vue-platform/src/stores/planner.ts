import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, type ApiErrorResponse } from '@/api/client';
import { useShoppingStore } from './shopping';

export interface MealPlanMeal {
  day: string;
  mealType: string; // 'breakfast' | 'lunch' | 'dinner'
  name: string;
  ingredients: string[];
  description?: string;
  steps?: string[];
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

export interface MealPlanGapItem {
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
}

export interface MealPlanResponse {
  meals: MealPlanMeal[];
  gapItems: MealPlanGapItem[];
  updatedAt: string;
}

export interface ImportGapsResult {
  created: number;
  skipped: number;
}

export const usePlannerStore = defineStore('planner', () => {
  const plan = ref<MealPlanResponse | null>(null);
  const loading = ref<boolean>(false);
  const generating = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchPlan() {
    loading.value = true;
    error.value = null;
    try {
      plan.value = await api.fetch<MealPlanResponse>('/meal-plan');
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr.code === 'MEAL_PLAN_NOT_FOUND' || !apiErr.code) {
        plan.value = null;
      } else {
        error.value = apiErr.error || 'Failed to load meal plan';
      }
    } finally {
      loading.value = false;
    }
  }

  async function generatePlan(currentDay?: string): Promise<boolean> {
    generating.value = true;
    error.value = null;
    try {
      const url = currentDay ? `/meal-plan?currentDay=${encodeURIComponent(currentDay)}` : '/meal-plan';
      plan.value = await api.fetch<MealPlanResponse>(url, { method: 'POST' });
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to generate meal plan';
      return false;
    } finally {
      generating.value = false;
    }
  }

  async function regenerateDay(day: string): Promise<boolean> {
    generating.value = true;
    error.value = null;
    try {
      plan.value = await api.fetch<MealPlanResponse>('/meal-plan/regenerate-day', {
        method: 'POST',
        body: JSON.stringify({ day })
      });
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to regenerate day';
      return false;
    } finally {
      generating.value = false;
    }
  }

  async function regenerateMeal(day: string, mealType: string): Promise<boolean> {
    generating.value = true;
    error.value = null;
    try {
      plan.value = await api.fetch<MealPlanResponse>('/meal-plan/regenerate-meal', {
        method: 'POST',
        body: JSON.stringify({ day, mealType })
      });
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to regenerate meal';
      return false;
    } finally {
      generating.value = false;
    }
  }

  async function fetchRecipe(day: string, mealType: string): Promise<boolean> {
    generating.value = true;
    error.value = null;
    try {
      plan.value = await api.fetch<MealPlanResponse>('/meal-plan/recipe', {
        method: 'POST',
        body: JSON.stringify({ day, mealType })
      });
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to fetch recipe';
      return false;
    } finally {
      generating.value = false;
    }
  }

  async function importGaps(items: MealPlanGapItem[]): Promise<ImportGapsResult | null> {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.fetch<ImportGapsResult>('/meal-plan/import-gaps', {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      const shoppingStore = useShoppingStore();
      await shoppingStore.fetchShoppingItems();
      await fetchPlan(); // Refresh gaps after import
      return res;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to import missing ingredients';
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    plan,
    loading,
    generating,
    error,
    fetchPlan,
    generatePlan,
    regenerateDay,
    regenerateMeal,
    fetchRecipe,
    importGaps
  };
});
