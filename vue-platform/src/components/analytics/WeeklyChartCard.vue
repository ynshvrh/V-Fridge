<script setup lang="ts">
import { computed } from 'vue';
import { type WeeklyTrend } from '@/stores/analytics';
import { useI18n } from '@/i18n';
import { BarChart3 } from '@lucide/vue';

const props = defineProps<{
  trends: WeeklyTrend[];
}>();

const { t } = useI18n();

const maxTotal = computed(() => {
  if (props.trends.length === 0) return 1;
  return Math.max(...props.trends.map(t => t.consumedCount + t.wastedCount + t.expiredCount), 1);
});

const calculateHeight = (val: number) => {
  return Math.max(Math.round((val / maxTotal.value) * 110), 3);
};
</script>

<template>
  <div class="nordic-card chart-card fade-in">
    <div class="chart-header">
      <div class="header-title">
        <BarChart3 :size="18" class="chart-icon" />
        <h3>{{ t('analyticsTrendsTitle') || 'Динаміка споживання за 8 тижнів' }}</h3>
      </div>

      <div class="legend-row">
        <span class="legend-item consumed"><span class="dot" /> {{ t('analyticsConsumed') || 'Спожито' }}</span>
        <span class="legend-item wasted"><span class="dot" /> {{ t('analyticsWasted') || 'Списано' }}</span>
        <span class="legend-item expired"><span class="dot" /> {{ t('analyticsExpired') || 'Прострочено' }}</span>
      </div>
    </div>

    <div v-if="trends.length === 0" class="empty-chart">
      <p>{{ t('analyticsNoHistorical') || 'Немає історичних даних за останні 8 тижнів.' }}</p>
    </div>

    <div v-else class="bars-container">
      <div v-for="(item, i) in trends" :key="i" class="week-column">
        <div class="bars-stack" :title="`Тиждень ${item.weekStartDate}: ${item.consumedCount} спожито, ${item.wastedCount} списано, ${item.expiredCount} прострочено`">
          <div class="bar bar-consumed" :style="{ height: `${calculateHeight(item.consumedCount)}px` }" />
          <div class="bar bar-wasted" :style="{ height: `${calculateHeight(item.wastedCount)}px` }" />
          <div class="bar bar-expired" :style="{ height: `${calculateHeight(item.expiredCount)}px` }" />
        </div>
        <span class="week-label">{{ (item.weekStartDate || '').slice(5) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.chart-icon {
  color: var(--text-muted);
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.76rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
}

.legend-item .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.legend-item.consumed .dot { background: var(--status-fresh); }
.legend-item.wasted .dot { background: var(--status-warning); }
.legend-item.expired .dot { background: var(--status-expired); }

.empty-chart {
  padding: 36px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.84rem;
}

.bars-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 140px;
  padding-top: 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.week-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.bars-stack {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 110px;
}

.bar {
  width: 8px;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
}

.bar-consumed { background: var(--status-fresh); }
.bar-wasted { background: var(--status-warning); }
.bar-expired { background: var(--status-expired); }

.week-label {
  font-size: 0.68rem;
  color: var(--text-muted);
}
</style>
