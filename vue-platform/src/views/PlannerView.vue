<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { usePlannerStore } from '@/stores/planner';
import { useFridgeStore } from '@/stores/fridge';
import { eventBus } from '@/utils/eventBus';
import FridgeSelector from '@/components/fridge/FridgeSelector.vue';
import MealCard from '@/components/planner/MealCard.vue';
import GapItemsCard from '@/components/planner/GapItemsCard.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import { ChefHat, Sparkles, RefreshCw, Calendar, AlertCircle, Utensils } from '@lucide/vue';

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

const getTodayDayName = () => {
  const dayIndex = new Date().getDay();
  const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return map[dayIndex];
};

const todayName = getTodayDayName();
const selectedDay = ref<string>(todayName);

let unsubscribePlanner: (() => void) | null = null;

onMounted(async () => {
  await fridgeStore.fetchFridges();
  await plannerStore.fetchPlan();

  if (plannerStore.plan?.meals && plannerStore.plan.meals.length > 0) {
    const hasToday = plannerStore.plan.meals.some(
      m => m.day.toLowerCase() === selectedDay.value.toLowerCase()
    );
    if (!hasToday) {
      selectedDay.value = plannerStore.plan.meals[0].day;
    }
  }

  unsubscribePlanner = eventBus.on('fridge:changed', () => {
    plannerStore.fetchPlan(true);
  });
});

onUnmounted(() => {
  if (unsubscribePlanner) {
    unsubscribePlanner();
  }
});

watch(() => fridgeStore.activeFridgeId, async (newId) => {
  if (newId) {
    await plannerStore.fetchPlan();
  }
});

// Meals strictly for the selected single day (3 meals: breakfast, lunch, dinner)
const currentDayMeals = computed(() => {
  if (!plannerStore.plan?.meals) return [];
  const target = selectedDay.value.toLowerCase();
  return plannerStore.plan.meals.filter(m => m.day.toLowerCase() === target);
});

// Count of meals per day
const daysWithMealCounts = computed(() => {
  const counts: Record<string, number> = {};
  if (!plannerStore.plan?.meals) return counts;
  for (const m of plannerStore.plan.meals) {
    const match = days.find(x => x.toLowerCase() === m.day.toLowerCase());
    if (match) {
      counts[match] = (counts[match] || 0) + 1;
    }
  }
  return counts;
});

const handleGeneratePlan = async () => {
  await plannerStore.generatePlan(selectedDay.value);
};

const handleRegenerateDay = async (day: string) => {
  await plannerStore.regenerateDay(day);
};
</script>

<template>
  <div class="planner-page fade-in">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <FridgeSelector @open-create-modal="showCreateFridgeModal = true" />
        <span class="badge badge-ai">
          <Sparkles :size="12" />
          <span>AI РЕКОМЕНДОВАНО</span>
        </span>
      </div>

      <div class="header-right">
        <button
          class="btn-primary"
          :disabled="plannerStore.generating"
          @click="handleGeneratePlan"
        >
          <Sparkles :size="18" :class="{ spin: plannerStore.generating }" />
          <span>{{ plannerStore.generating ? 'Генерація...' : 'Створити план на день' }}</span>
        </button>
      </div>
    </header>

    <!-- Error Banner -->
    <div v-if="plannerStore.error" class="error-banner">
      <AlertCircle :size="18" />
      <span>{{ plannerStore.error }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="plannerStore.loading" class="loading-state glass-card">
      <ChefHat class="spin-icon" :size="36" />
      <p>Завантаження AI плану харчування...</p>
    </div>

    <!-- Empty State (No plan at all) -->
    <div v-else-if="!plannerStore.plan" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <ChefHat :size="36" />
      </div>
      <h3>План харчування ще не створено</h3>
      <p>Натисніть «Створити план на день», щоб згенерувати 3 персоналізовані страви на основі продуктів у вашому холодильнику.</p>
      <button class="btn-primary" style="margin-top: 16px;" :disabled="plannerStore.generating" @click="handleGeneratePlan">
        <Sparkles :size="18" />
        <span>Створити AI План</span>
      </button>
    </div>

    <!-- Main Planner Content -->
    <div v-else class="planner-content">
      <!-- Horizontal Day Navigation Bar -->
      <div class="day-tabs-bar">
        <button
          v-for="day in days"
          :key="day"
          type="button"
          class="day-tab-btn"
          :class="{
            active: selectedDay.toLowerCase() === day.toLowerCase(),
            'is-today': todayName.toLowerCase() === day.toLowerCase(),
            'has-meals': (daysWithMealCounts[day] || 0) > 0
          }"
          @click="selectedDay = day"
        >
          <span class="day-label">{{ dayLabels[day] || day }}</span>
          <span v-if="todayName.toLowerCase() === day.toLowerCase()" class="today-tag">сьогодні</span>
          <span v-if="(daysWithMealCounts[day] || 0) > 0" class="meals-count-tag">
            {{ daysWithMealCounts[day] }} страв
          </span>
        </button>
      </div>

      <!-- Focused Single Day Section (No Stacking) -->
      <div v-if="currentDayMeals.length > 0" class="day-section fade-in">
        <div class="day-header">
          <div class="day-title">
            <div class="day-icon-circle">
              <Calendar :size="16" />
            </div>
            <div>
              <h3>{{ dayLabels[selectedDay] || selectedDay }}</h3>
              <p class="day-subtitle">Збалансоване меню на 3 прийоми їжі</p>
            </div>
          </div>
          <button
            class="btn-ghost btn-sm refresh-day-btn"
            title="Оновити меню на цей день"
            :disabled="plannerStore.generating"
            @click="handleRegenerateDay(selectedDay)"
          >
            <RefreshCw :size="14" :class="{ spin: plannerStore.generating }" />
            <span>Оновити день</span>
          </button>
        </div>

        <!-- 3 Meals Grid (Breakfast, Lunch, Dinner) -->
        <div class="meals-grid">
          <MealCard
            v-for="(meal, idx) in currentDayMeals"
            :key="`${selectedDay}-${meal.mealType || idx}`"
            :meal="meal"
          />
        </div>

        <!-- Gap Items Card for 1-Click Shopping List Import -->
        <div v-if="plannerStore.plan.gapItems && plannerStore.plan.gapItems.length > 0" class="gap-section">
          <GapItemsCard :gaps="plannerStore.plan.gapItems" />
        </div>
      </div>

      <!-- Empty Selected Day prompt -->
      <div v-else class="day-empty-card glass-card fade-in">
        <div class="empty-icon-circle">
          <Utensils :size="24" />
        </div>
        <h4>На {{ dayLabels[selectedDay] || selectedDay }} меню ще не згенеровано</h4>
        <p>Натисніть кнопку нижче, щоб ШІ створив персоналізовані сніданок, обід та вечерю.</p>
        <button
          class="btn-primary"
          :disabled="plannerStore.generating"
          @click="handleGeneratePlan"
        >
          <Sparkles :size="16" :class="{ spin: plannerStore.generating }" />
          <span>{{ plannerStore.generating ? 'Створюємо...' : `Скласти меню на ${dayLabels[selectedDay] || selectedDay}` }}</span>
        </button>
      </div>
    </div>

    <CreateFridgeModal v-if="showCreateFridgeModal" @close="showCreateFridgeModal = false" />
  </div>
</template>

<style scoped>
.planner-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
}

.loading-state,
.empty-state {
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
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.empty-state p {
  font-size: 0.84rem;
  color: var(--text-muted);
  max-width: 360px;
}

.planner-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Day Tabs Bar */
.day-tabs-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.day-tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
  min-width: 96px;
}

.day-tab-btn:hover {
  border-color: var(--primary);
  color: var(--text-primary);
}

.day-tab-btn.active {
  background: var(--june-bud-light);
  border-color: var(--june-bud);
  color: #2c3809;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(190, 211, 90, 0.25);
}

.day-label {
  font-size: 0.82rem;
}

.today-tag {
  font-size: 0.65rem;
  background: var(--primary-subtle);
  color: var(--primary);
  padding: 1px 5px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.meals-count-tag {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.day-tab-btn.active .meals-count-tag {
  color: #4d5f10;
}

/* Focused Day Section */
.day-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.day-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.day-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--aqua-mist-light);
  color: var(--aqua-mist-dark);
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-title h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.day-subtitle {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin: 0;
}

.refresh-day-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.meals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

@media (max-width: 900px) {
  .meals-grid {
    grid-template-columns: 1fr;
  }
}

.gap-section {
  margin-top: 4px;
}

.day-empty-card {
  padding: 36px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--bg-subtle);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-empty-card h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.day-empty-card p {
  font-size: 0.82rem;
  color: var(--text-muted);
  max-width: 360px;
  margin: 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
