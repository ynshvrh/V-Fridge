import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';

export interface NutritionLog {
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
}

export interface NutritionTargets {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface DailyNutritionResponse {
  date: string;
  targets: NutritionTargets;
  summary: NutritionSummary;
  logs: NutritionLog[];
}

export interface LogFoodPayload {
  date: string;
  mealType: string;
  foodName: string;
  quantity?: number | null;
  unit?: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  productId?: number | null;
}

export interface UpdateLogPayload {
  mealType: string;
  foodName: string;
  quantity?: number | null;
  unit?: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface SetTargetsPayload {
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
}

export const useNutritionStore = defineStore('nutrition', () => {
  const dailyCache = ref<Record<string, DailyNutritionResponse>>({});
  const currentData = ref<DailyNutritionResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDailyData(date: string) {
    loading.value = true;
    error.value = null;

    if (dailyCache.value[date]) {
      currentData.value = dailyCache.value[date];
    }

    try {
      const resp = await api.fetch<DailyNutritionResponse>(`/nutrition/daily?date=${encodeURIComponent(date)}`);
      currentData.value = resp;
      dailyCache.value[date] = resp;
      return resp;
    } catch (err: any) {
      error.value = err.error || err.message || 'Помилка завантаження даних щоденника харчування';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logFood(payload: LogFoodPayload) {
    try {
      const created = await api.fetch<NutritionLog>('/nutrition/log', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await fetchDailyData(payload.date);
      return created;
    } catch (err: any) {
      error.value = err.error || err.message || 'Помилка збереження запису харчування';
      throw err;
    }
  }

  async function updateLog(id: number, date: string, payload: UpdateLogPayload) {
    try {
      const updated = await api.fetch<NutritionLog>(`/nutrition/log/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      await fetchDailyData(date);
      return updated;
    } catch (err: any) {
      error.value = err.error || err.message || 'Помилка оновлення запису харчування';
      throw err;
    }
  }

  async function deleteLog(id: number, date: string) {
    try {
      await api.fetch(`/nutrition/log/${id}`, {
        method: 'DELETE'
      });
      await fetchDailyData(date);
    } catch (err: any) {
      error.value = err.error || err.message || 'Помилка вилучення запису харчування';
      throw err;
    }
  }

  async function setTargets(payload: SetTargetsPayload, date: string) {
    try {
      const updatedTargets = await api.fetch<NutritionTargets>('/nutrition/targets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await fetchDailyData(date);
      return updatedTargets;
    } catch (err: any) {
      error.value = err.error || err.message || 'Помилка збереження цілей харчування';
      throw err;
    }
  }

  return {
    dailyCache,
    currentData,
    loading,
    error,
    fetchDailyData,
    logFood,
    updateLog,
    deleteLog,
    setTargets
  };
});
