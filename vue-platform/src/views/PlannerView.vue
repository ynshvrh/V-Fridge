<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePlannerStore } from '@/stores/planner';
import { useFridgeStore } from '@/stores/fridge';
import FridgeSelector from '@/components/fridge/FridgeSelector.vue';
import MealCard from '@/components/planner/MealCard.vue';
import GapItemsCard from '@/components/planner/GapItemsCard.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import { ChefHat, Sparkles, RefreshCw, Calendar, AlertCircle } from '@lucide/vue';

const plannerStore = usePlannerStore();
const fridgeStore = useFridgeStore();

const showCreateFridgeModal = ref(false);

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
      <GapItemsCard :gaps="plannerStore.plan.gapItems" />

      <div class="days-container">
        <template v-for="day in days" :key="day">
          <div v-if="mealsByDay[day] && mealsByDay[day].length > 0" class="day-section">
            <div class="day-header">
              <div class="day-title">
                <Calendar :size="16" />
                <h3>{{ day }}</h3>
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
  padding: 56px 20px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spin-icon {
  color: var(--accent-orange);
  margin-bottom: 12px;
}

.empty-icon-bg {
  width: 60px;
  height: 60px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
  display: flex;
  align-items: center;
  justify-content: center;
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
  gap: 24px;
}

.days-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.day-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.day-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.icon-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.icon-btn:hover {
  color: var(--accent-orange);
  background: var(--accent-orange-bg);
}

.meals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

@media (max-width: 640px) {
  .meals-grid {
    grid-template-columns: 1fr;
  }
}
</style>
