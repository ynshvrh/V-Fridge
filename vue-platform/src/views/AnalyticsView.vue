<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAnalyticsStore } from '@/stores/analytics';
import { useFridgeStore } from '@/stores/fridge';
import FridgeSelector from '@/components/fridge/FridgeSelector.vue';
import WeeklyChartCard from '@/components/analytics/WeeklyChartCard.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import { BarChart3, AlertTriangle, Zap, Clock } from '@lucide/vue';

const analyticsStore = useAnalyticsStore();
const fridgeStore = useFridgeStore();

const showCreateFridgeModal = ref(false);

onMounted(async () => {
  await fridgeStore.fetchFridges();
  await analyticsStore.fetchAnalytics();
});
</script>

<template>
  <div class="analytics-page fade-in">
    <header class="page-header">
      <div class="header-left">
        <FridgeSelector @open-create-modal="showCreateFridgeModal = true" />
      </div>
    </header>

    <div v-if="analyticsStore.loading" class="loading-state glass-card">
      <BarChart3 class="spin-icon" :size="36" />
      <p>Loading analytics report...</p>
    </div>

    <div v-else-if="!analyticsStore.summary" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <BarChart3 :size="36" />
      </div>
      <h3>No Analytics Data</h3>
      <p>Log consumption or food waste in your fridge to generate analytics insights.</p>
    </div>

    <div v-else class="analytics-content">
      <WeeklyChartCard :trends="analyticsStore.summary.weeklyTrends" />

      <div class="metrics-grid">
        <div class="glass-card metric-card">
          <div class="card-title text-warning">
            <AlertTriangle :size="20" />
            <h3>Most Wasted Products (30 Days)</h3>
          </div>

          <div v-if="analyticsStore.summary.mostWasted.length === 0" class="empty-list">
            No wasted items recorded! Great job minimizing food waste.
          </div>

          <div v-else class="leaderboard-list">
            <div v-for="(item, idx) in analyticsStore.summary.mostWasted" :key="idx" class="leader-row">
              <div class="leader-info">
                <span class="leader-rank">#{{ idx + 1 }}</span>
                <span class="leader-name">{{ item.name }}</span>
              </div>
              <div class="leader-stats">
                <span class="badge-tag">{{ item.category }}</span>
                <span class="stat-value text-warning">{{ item.totalQuantity }} units ({{ item.occurrences }}x)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card metric-card">
          <div class="card-title text-cyan">
            <Zap :size="20" />
            <h3>Fastest Consumed Products</h3>
          </div>

          <div v-if="analyticsStore.summary.fastestConsumed.length === 0" class="empty-list">
            No consumption logs recorded yet.
          </div>

          <div v-else class="leaderboard-list">
            <div v-for="(item, idx) in analyticsStore.summary.fastestConsumed" :key="idx" class="leader-row">
              <div class="leader-info">
                <span class="leader-rank">#{{ idx + 1 }}</span>
                <span class="leader-name">{{ item.productName }}</span>
              </div>
              <div class="leader-stats">
                <span class="badge-tag">{{ item.category }}</span>
                <span class="stat-value text-cyan">
                  <Clock :size="12" /> {{ item.ageDays }} day{{ item.ageDays === 1 ? '' : 's' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CreateFridgeModal v-if="showCreateFridgeModal" @close="showCreateFridgeModal = false" />
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.loading-state, .empty-state {
  padding: 64px 24px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spin-icon {
  color: var(--accent-purple);
  margin-bottom: 12px;
}

.empty-icon-bg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: rgba(140, 83, 131, 0.15);
  color: var(--accent-purple-hover);
  display: flex;
  align-items: center;
  justify-content: center;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.metric-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.text-warning { color: var(--accent-amber); }
.text-cyan { color: var(--accent-cyan); }

.empty-list {
  color: var(--text-muted);
  font-size: 0.875rem;
  padding: 20px 0;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.leader-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(15, 14, 23, 0.5);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.leader-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.leader-rank {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.leader-name {
  font-weight: 500;
  color: var(--text-primary);
}

.leader-stats {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-tag {
  font-size: 0.72rem;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-muted);
}

.stat-value {
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
