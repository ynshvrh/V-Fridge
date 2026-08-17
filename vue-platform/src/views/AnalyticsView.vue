<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAnalyticsStore } from '@/stores/analytics';
import { useFridgeStore } from '@/stores/fridge';
import { useI18n } from '@/i18n';
import WeeklyChartCard from '@/components/analytics/WeeklyChartCard.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import { BarChart3, AlertTriangle, Zap, Clock } from '@lucide/vue';

const analyticsStore = useAnalyticsStore();
const fridgeStore = useFridgeStore();
const { t } = useI18n();

const showCreateFridgeModal = ref(false);

onMounted(async () => {
  await fridgeStore.fetchFridges();
  await analyticsStore.fetchAnalytics();
});
</script>

<template>
  <div class="analytics-page fade-in">
    <header class="page-header">
      <div>
        <h2 class="section-heading">{{ t('analyticsTitle') || 'Аналітика продуктів' }}</h2>
        <p class="section-subheading">{{ t('analyticsSubtitle') || 'Статистика споживання, термінів та списань' }}</p>
      </div>
    </header>

    <div v-if="analyticsStore.loading" class="loading-state nordic-card">
      <BarChart3 class="spin-icon" :size="28" />
      <p>{{ t('analyticsLoading') || 'Завантаження звіту аналітики...' }}</p>
    </div>

    <div v-else-if="!analyticsStore.summary" class="empty-state nordic-card">
      <div class="empty-icon-box">
        <BarChart3 :size="24" />
      </div>
      <h3>{{ t('analyticsEmptyTitle') || 'Немає даних аналітики' }}</h3>
      <p>{{ t('analyticsEmptyDesc') || 'Фіксуйте споживання або списання продуктів у холодильнику для відображення графіків.' }}</p>
    </div>

    <div v-else class="analytics-content">
      <WeeklyChartCard :trends="analyticsStore.summary.weeklyTrends" />

      <div class="metrics-grid">
        <!-- Most Wasted -->
        <div class="nordic-card metric-card">
          <div class="card-title text-warning">
            <AlertTriangle :size="16" />
            <h3>{{ t('analyticsMostWasted') || 'Найчастіше списані (30 днів)' }}</h3>
          </div>

          <div v-if="analyticsStore.summary.mostWasted.length === 0" class="empty-list">
            {{ t('analyticsNoWasted') || 'Списаних продуктів немає! Чудова робота зі зменшення відходів.' }}
          </div>

          <div v-else class="leaderboard-list">
            <div v-for="(item, idx) in analyticsStore.summary.mostWasted" :key="idx" class="leader-row">
              <div class="leader-info">
                <span class="leader-rank">#{{ idx + 1 }}</span>
                <span class="leader-name">{{ item.name }}</span>
              </div>
              <div class="leader-stats">
                <span class="badge-tag">{{ item.category }}</span>
                <span class="stat-value text-warning">{{ item.totalQuantity }} шт. ({{ item.occurrences }}x)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Fastest Consumed -->
        <div class="nordic-card metric-card">
          <div class="card-title text-fresh">
            <Zap :size="16" />
            <h3>{{ t('analyticsFastestConsumed') || 'Найшвидше споживані продукти' }}</h3>
          </div>

          <div v-if="analyticsStore.summary.fastestConsumed.length === 0" class="empty-list">
            {{ t('analyticsNoConsumed') || 'Записи споживання поки відсутні.' }}
          </div>

          <div v-else class="leaderboard-list">
            <div v-for="(item, idx) in analyticsStore.summary.fastestConsumed" :key="idx" class="leader-row">
              <div class="leader-info">
                <span class="leader-rank">#{{ idx + 1 }}</span>
                <span class="leader-name">{{ item.productName }}</span>
              </div>
              <div class="leader-stats">
                <span class="badge-tag">{{ item.category }}</span>
                <span class="stat-value text-fresh">
                  <Clock :size="12" /> {{ item.ageDays }} {{ t('daysUnit') || 'дн.' }}
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
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  margin-bottom: 4px;
}

.section-heading {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.section-subheading {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 2px;
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
  color: var(--text-primary);
  margin-bottom: 10px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.empty-icon-box {
  width: 46px;
  height: 46px;
  margin-bottom: 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 16px;
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
  font-size: 0.92rem;
  font-weight: 600;
}

.text-warning { color: var(--status-warning); }
.text-fresh { color: var(--status-fresh); }

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
  padding: 7px 10px;
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
  font-size: 0.84rem;
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
  padding: 2px 5px;
  border-radius: 3px;
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

.stat-value {
  font-size: 0.78rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
