<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePlannerStore } from '@/stores/planner';
import { useFridgeStore } from '@/stores/fridge';
import { useI18n } from '@/i18n';
import MealCard from '@/components/planner/MealCard.vue';
import GapItemsCard from '@/components/planner/GapItemsCard.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import { ChefHat, Sparkles, RefreshCw, Calendar, AlertCircle } from '@lucide/vue';

const plannerStore = usePlannerStore();
const fridgeStore = useFridgeStore();
const { t } = useI18n();

const showCreateFridgeModal = ref(false);

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const localizedDayNames: Record<string, string> = {
  Monday: 'Понеділок',
  Tuesday: 'Вівторок',
  Wednesday: 'Середа',
  Thursday: 'Четвер',
  Friday: 'П\'ятниця',
  Saturday: 'Субота',
  Sunday: 'Неділя'
};

onMounted(async () => {
  await fridgeStore.fetchFridges();
  await plannerStore.fetchPlan();
});

const mealsByDay = computed(() => {
  if (!plannerStore.plan) return {};
  const map: Record<string, typeof plannerStore.plan.meals> = {};
  for (const day of days) {
    map[day] = plannerStore.plan.meals.filter(m => m.day.toLowerCase() === day.toLowerCase());
  }
  return map;
});

const handleGeneratePlan = async () => {
  await plannerStore.generatePlan();
};

const handleRegenerateDay = async (day: string) => {
  await plannerStore.regenerateDay(day);
};
</script>

<template>
  <div class="planner-page fade-in">
    <header class="page-header">
      <div>
        <h2 class="section-heading">{{ t('navPlanner') }}</h2>
        <p class="section-subheading">{{ t('dashboardQuickPlannerDesc') }}</p>
      </div>

      <div class="header-actions">
        <button class="btn-primary btn-sm" :disabled="plannerStore.generating" @click="handleGeneratePlan">
          <Sparkles :size="15" :class="{ spin: plannerStore.generating }" />
          <span>{{ plannerStore.generating ? (t('plannerGenerating') || 'Генерація плану...') : (t('plannerGenerateBtn') || 'Створити план харчування') }}</span>
        </button>
      </div>
    </header>

    <div v-if="plannerStore.error" class="error-banner">
      <AlertCircle :size="16" />
      <span>{{ plannerStore.error }}</span>
    </div>

    <div v-if="plannerStore.loading" class="loading-state nordic-card">
      <ChefHat class="spin-icon" :size="28" />
      <p>{{ t('plannerLoading') || 'Завантаження AI плану харчування...' }}</p>
    </div>

    <div v-else-if="!plannerStore.plan" class="empty-state nordic-card">
      <div class="empty-icon-box">
        <ChefHat :size="24" />
      </div>
      <h3>{{ t('plannerEmptyTitle') || 'План харчування ще не створено' }}</h3>
      <p>{{ t('plannerEmptyDesc') || 'Натисніть "Створити план харчування", щоб згенерувати рецепти на 7 днів на основі ваших продуктів.' }}</p>
      <button class="btn-primary" style="margin-top: 14px;" :disabled="plannerStore.generating" @click="handleGeneratePlan">
        <Sparkles :size="15" />
        <span>{{ t('plannerGenerateBtn') || 'Створити AI План' }}</span>
      </button>
    </div>

    <div v-else class="planner-content">
      <GapItemsCard :gaps="plannerStore.plan.gapItems" />

      <div class="days-container">
        <template v-for="day in days" :key="day">
          <div v-if="mealsByDay[day] && mealsByDay[day].length > 0" class="day-section">
            <div class="day-header">
              <div class="day-title">
                <Calendar :size="15" />
                <h3>{{ localizedDayNames[day] || day }}</h3>
              </div>
              <button
                class="icon-btn"
                :title="t('plannerRegenerateDay') || 'Перегенерувати страви дня'"
                :disabled="plannerStore.generating"
                @click="handleRegenerateDay(day)"
              >
                <RefreshCw :size="13" :class="{ spin: plannerStore.generating }" />
                <span>{{ t('plannerRegenerateDay') || 'Оновити день' }}</span>
              </button>
            </div>

            <div class="meals-grid">
              <MealCard v-for="(meal, idx) in mealsByDay[day]" :key="idx" :meal="meal" />
            </div>
          </div>
        </template>
      </div>
    </div>

    <CreateFridgeModal v-if="showCreateFridgeModal" @close="showCreateFridgeModal = false" />
  </div>
</template>

<style scoped>
.planner-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
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

.btn-sm {
  padding: 7px 12px;
  font-size: 0.82rem;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--status-expired-bg);
  border: 1px solid var(--status-expired-border);
  color: var(--status-expired);
  padding: 10px 14px;
  border-radius: var(--radius-xs);
  font-size: 0.85rem;
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

.empty-state h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.empty-state p {
  font-size: 0.82rem;
  color: var(--text-muted);
  max-width: 380px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.planner-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.days-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle);
}

.day-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
  font-size: 0.92rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  color: var(--text-muted);
  padding: 3px 6px;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.icon-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.meals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

@media (max-width: 600px) {
  .meals-grid {
    grid-template-columns: 1fr;
  }
}
</style>
