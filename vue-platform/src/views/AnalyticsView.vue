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
      <p>Завантаження звіту аналітики...</p>
    </div>

    <div v-else-if="!analyticsStore.summary" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <BarChart3 :size="36" />
      </div>
      <h3>Немає даних аналітики</h3>
      <p>Фіксуйте споживання або списання продуктів у холодильнику для відображення аналітики.</p>
    </div>

    <div v-else class="analytics-content">
      <WeeklyChartCard :trends="analyticsStore.summary.weeklyTrends" />

      <div class="metrics-grid">
        <div class="glass-card metric-card">
          <div class="card-title text-warning">
            <AlertTriangle :size="20" />
            <h3>Найчастіше списані (30 днів)</h3>
          </div>

          <div v-if="analyticsStore.summary.mostWasted.length === 0" class="empty-list">
            Списаних продуктів немає! Чудова робота зі зменшення відходів.
          </div>

          <div v-else class="leaderboard-list">
            <div v-for="(item, idx) in analyticsStore.summary.mostWasted" :key="idx" class="leader-row">
              <div class="leader-info">
                <span class="leader-rank">#{{ idx + 1 }}</span>
                <span class="leader-name">{{ item.name }}</span>
              </div>
              <div class="leader-stats">
                <span class="badge-tag">{{ item.category }}</span>
                <span class="stat-value text-warning">{{ item.totalQuantity }} од. ({{ item.occurrences }}x)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card metric-card">
          <div class="card-title text-blue">
            <Zap :size="20" />
            <h3>Найшвидше споживані продукти</h3>
          </div>

          <div v-if="analyticsStore.summary.fastestConsumed.length === 0" class="empty-list">
            Записи споживання поки відсутні.
          </div>

          <div v-else class="leaderboard-list">
            <div v-for="(item, idx) in analyticsStore.summary.fastestConsumed" :key="idx" class="leader-row">
              <div class="leader-info">
                <span class="leader-rank">#{{ idx + 1 }}</span>
                <span class="leader-name">{{ item.productName }}</span>
              </div>
              <div class="leader-stats">
                <span class="badge-tag">{{ item.category }}</span>
                <span class="stat-value text-blue">
                  <Clock :size="12" /> {{ item.ageDays }} дн{{ item.ageDays === 1 ? 'ь' : 'ів' }}
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
  margin-bottom: 16px;
}

.loading-state, .empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spin-icon {
  color: var(--primary);
  margin-bottom: 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.empty-icon-bg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.empty-state p {
  font-size: 0.82rem;
  color: var(--text-muted);
  max-width: 340px;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.metric-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title h3 {
  font-size: 0.95rem;
  font-weight: 600;
}

.text-warning { color: var(--status-warning); }
.text-blue { color: var(--status-fresh); }

.empty-list {
  color: var(--text-muted);
  font-size: 0.82rem;
  padding: 12px 0;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.leader-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--bg-subtle);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.leader-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.leader-rank {
  font-weight: 700;
  font-size: 0.76rem;
  color: var(--text-muted);
}

.leader-name {
  font-weight: 500;
  font-size: 0.86rem;
  color: var(--text-primary);
}

.leader-stats {
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-tag {
  font-size: 0.65rem;
  text-transform: uppercase;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.stat-value {
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
