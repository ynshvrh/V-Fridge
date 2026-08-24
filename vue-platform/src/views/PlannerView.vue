<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { usePlannerStore } from '@/stores/planner';
import { useFridgeStore } from '@/stores/fridge';
import FridgeSelector from '@/components/fridge/FridgeSelector.vue';
import MealCard from '@/components/planner/MealCard.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import { ChefHat, Sparkles, RefreshCw, Calendar, AlertCircle } from '@lucide/vue';

const plannerStore = usePlannerStore();
const fridgeStore = useFridgeStore();

const showCreateFridgeModal = ref(false);

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const dayLabels: Record<string, string> = {
  Monday: 'Понеділок',
  Tuesday: 'Вівторок',
  Wednesday: 'Середа',
  Thursday: 'Четвер',
  Friday: "П'ятниця",
  Saturday: 'Субота',
  Sunday: 'Неділя'
};

onMounted(async () => {
  await fridgeStore.fetchFridges();
  await plannerStore.fetchPlan();
});

watch(() => fridgeStore.activeFridgeId, async (newId) => {
  if (newId) {
    await plannerStore.fetchPlan();
  }
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
      <div class="header-left">
        <FridgeSelector @open-create-modal="showCreateFridgeModal = true" />
        <span class="badge badge-ai">
          <Sparkles :size="12" />
          <span>AI РЕКОМЕНДОВАНО</span>
        </span>
      </div>

      <div class="header-right">
        <button class="btn-primary" :disabled="plannerStore.generating" @click="handleGeneratePlan">
          <Sparkles :size="18" :class="{ spin: plannerStore.generating }" />
          <span>{{ plannerStore.generating ? 'Генерація плану...' : 'Створити план харчування' }}</span>
        </button>
      </div>
    </header>

    <div v-if="plannerStore.error" class="error-banner">
      <AlertCircle :size="18" />
      <span>{{ plannerStore.error }}</span>
    </div>

    <div v-if="plannerStore.loading" class="loading-state glass-card">
      <ChefHat class="spin-icon" :size="36" />
      <p>Завантаження AI плану харчування...</p>
    </div>

    <div v-else-if="!plannerStore.plan" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <ChefHat :size="36" />
      </div>
      <h3>План харчування ще не створено</h3>
      <p>Натисніть "Створити план харчування", щоб згенерувати персоналізовані рецепти на основі наявних продуктів.</p>
      <button class="btn-primary" style="margin-top: 16px;" :disabled="plannerStore.generating" @click="handleGeneratePlan">
        <Sparkles :size="18" />
        <span>Створити AI План</span>
      </button>
    </div>

    <div v-else class="planner-content">
      <div class="days-container">
        <template v-for="day in days" :key="day">
          <div v-if="mealsByDay[day] && mealsByDay[day].length > 0" class="day-section">
            <div class="day-header">
              <div class="day-title">
                <Calendar :size="16" />
                <h3>{{ dayLabels[day] || day }}</h3>
              </div>
              <button class="icon-btn" title="Перегенерувати страви дня" :disabled="plannerStore.generating" @click="handleRegenerateDay(day)">
                <RefreshCw :size="14" :class="{ spin: plannerStore.generating }" />
                <span>Оновити день</span>
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
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--status-expired-bg);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--status-expired);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
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
}

.empty-icon-bg {
  width: 48px;
  height: 48px;
  margin-bottom: 14px;
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
  max-width: 320px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.planner-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  gap: 8px;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
}

.icon-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
}

.icon-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.meals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

@media (max-width: 640px) {
  .meals-grid {
    grid-template-columns: 1fr;
  }
}
</style>
