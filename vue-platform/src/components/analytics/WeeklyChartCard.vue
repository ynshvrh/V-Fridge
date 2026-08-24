<script setup lang="ts">
import { computed } from 'vue';
import { type WeeklyTrend } from '@/stores/analytics';
import { BarChart3 } from '@lucide/vue';

const props = defineProps<{
  trends: WeeklyTrend[];
}>();

const maxTotal = computed(() => {
  if (props.trends.length === 0) return 1;
  return Math.max(...props.trends.map(t => t.consumedCount + t.wastedCount + t.expiredCount), 1);
});

const calculateHeight = (val: number) => {
  return Math.max(Math.round((val / maxTotal.value) * 120), 4);
};
</script>

<template>
  <div class="glass-card chart-card fade-in">
    <div class="chart-header">
      <div class="header-title">
        <BarChart3 :size="18" class="header-icon" />
        <h3>Динаміка споживання (8 тижнів)</h3>
      </div>

      <div class="legend-row">
        <span class="legend-item consumed"><span class="dot"></span> Спожито</span>
        <span class="legend-item wasted"><span class="dot"></span> Списано</span>
        <span class="legend-item expired"><span class="dot"></span> Прострочено</span>
      </div>
    </div>

    <div v-if="trends.length === 0" class="empty-chart">
      <p>Немає даних за останні 8 тижнів.</p>
    </div>

    <div v-else class="bars-container">
      <div v-for="(t, i) in trends" :key="i" class="week-column">
        <div class="bars-stack" :title="`Тиждень ${t.weekStartDate}: ${t.consumedCount} спожито, ${t.wastedCount} списано, ${t.expiredCount} прострочено`">
          <div class="bar bar-consumed" :style="{ height: `${calculateHeight(t.consumedCount)}px` }"></div>
          <div class="bar bar-wasted" :style="{ height: `${calculateHeight(t.wastedCount)}px` }"></div>
          <div class="bar bar-expired" :style="{ height: `${calculateHeight(t.expiredCount)}px` }"></div>
        </div>
        <span class="week-label">{{ (t.weekStartDate || '').slice(5) }}</span>
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

.header-icon {
  color: var(--primary);
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
  padding: 32px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.bars-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 140px;
  padding-top: 16px;
  border-bottom: 1px solid var(--border-subtle);
  gap: 4px;
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
