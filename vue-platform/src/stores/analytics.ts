import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, type ApiErrorResponse } from '@/api/client';

export interface MostWastedItem {
  name: string;
  totalQuantity: number;
  occurrences: number;
  category: string;
}

export interface FastestConsumedItem {
  productName: string;
  category: string;
  ageDays: number;
}

export interface WeeklyTrend {
  weekStartDate: string;
  consumedCount: number;
  wastedCount: number;
  expiredCount: number;
}

export interface AnalyticsSummary {
  mostWasted: MostWastedItem[];
  fastestConsumed: FastestConsumedItem[];
  weeklyTrends: WeeklyTrend[];
}

export const useAnalyticsStore = defineStore('analytics', () => {
  const summary = ref<AnalyticsSummary | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchAnalytics() {
    loading.value = true;
    error.value = null;
    try {
      summary.value = await api.fetch<AnalyticsSummary>('/analytics');
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to load analytics';
    } finally {
      loading.value = false;
    }
  }

  return {
    summary,
    loading,
    error,
    fetchAnalytics
  };
});
