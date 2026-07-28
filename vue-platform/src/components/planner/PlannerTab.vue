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
  <div class="planner-tab-container fade-in">
    <!-- Action Header -->
    <header class="planner-header">
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
      <p>Натисніть "Створити план харчування", щоб згенерувати персоналізовані рецепти на тиждень з наявних продуктів.</p>
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
.planner-tab-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.planner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--status-expired-bg);
  color: var(--status-expired);
  font-size: 0.85rem;
  font-weight: 600;
}

.loading-state, .empty-state {
  padding: 48px 20px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spin-icon {
  color: var(--accent-orange);
  margin-bottom: 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.empty-icon-bg {
  width: 56px;
  height: 56px;
  margin-bottom: 14px;
  border-radius: 50%;
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
  display: flex;
  align-items: center;
  justify-content: center;
}

.planner-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.days-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle);
}

.day-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent-orange);
}

.day-title h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.icon-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.icon-btn:hover {
  background: var(--border-subtle);
  color: var(--text-primary);
}

.meals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.spin {
  animation: spin 1s linear infinite;
}
</style>
