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
        <BarChart3 :size="20" class="header-icon" />
        <h3>8-Week Consumption Trends</h3>
      </div>

      <div class="legend-row">
        <span class="legend-item consumed"><span class="dot"></span> Consumed</span>
        <span class="legend-item wasted"><span class="dot"></span> Wasted</span>
        <span class="legend-item expired"><span class="dot"></span> Expired</span>
      </div>
    </div>

    <div v-if="trends.length === 0" class="empty-chart">
      <p>No historical consumption log data available for the last 8 weeks.</p>
    </div>

    <div v-else class="bars-container">
      <div v-for="(t, i) in trends" :key="i" class="week-column">
        <div class="bars-stack" :title="`Week of ${t.weekStartDate}: ${t.consumedCount} consumed, ${t.wastedCount} wasted, ${t.expiredCount} expired`">
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
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: var(--accent-purple-hover);
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.8rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
}

.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-item.consumed .dot { background: var(--accent-emerald); }
.legend-item.wasted .dot { background: var(--accent-amber); }
.legend-item.expired .dot { background: var(--accent-rose); }

.empty-chart {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.bars-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 160px;
  padding-top: 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.week-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.bars-stack {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
}

.bar {
  width: 10px;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}

.bar-consumed { background: var(--accent-emerald); }
.bar-wasted { background: var(--accent-amber); }
.bar-expired { background: var(--accent-rose); }

.week-label {
  font-size: 0.72rem;
  color: var(--text-muted);
}
</style>
