<script setup lang="ts">
import { ref } from 'vue';
import { type MealPlanMeal, usePlannerStore } from '@/stores/planner';
import { ChefHat, RefreshCw, BookOpen, Flame, ChevronRight } from '@lucide/vue';

const props = defineProps<{
  meal: MealPlanMeal;
}>();

const plannerStore = usePlannerStore();
const isExpanded = ref(false);
const isRegenerating = ref(false);
const isFetchingRecipe = ref(false);

const handleRegenerate = async () => {
  isRegenerating.value = true;
  await plannerStore.regenerateMeal(props.meal.day, props.meal.mealType);
  isRegenerating.value = false;
};

const toggleRecipe = async () => {
  if (!isExpanded.value && (!props.meal.steps || props.meal.steps.length === 0)) {
    isFetchingRecipe.value = true;
    await plannerStore.fetchRecipe(props.meal.day, props.meal.mealType);
    isFetchingRecipe.value = false;
  }
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <div class="glass-card meal-card fade-in">
    <div class="meal-header">
      <div class="header-type">
        <ChefHat :size="14" class="type-icon" />
        <span class="type-label">{{ meal.mealType }}</span>
      </div>

      <button class="icon-btn" title="Оновити цю страву" :disabled="isRegenerating" @click="handleRegenerate">
        <RefreshCw :size="14" :class="{ spin: isRegenerating }" />
      </button>
    </div>

    <div class="meal-body">
      <h4 class="meal-name">{{ meal.name }}</h4>

      <div class="ingredients-wrap">
        <span v-for="(ing, idx) in meal.ingredients" :key="idx" class="ing-tag">
          {{ ing }}
        </span>
      </div>

      <div v-if="meal.calories" class="macros-row">
        <span class="macro-chip"><Flame :size="12" /> {{ meal.calories }} ккал</span>
        <span v-if="meal.protein" class="macro-chip">Б: {{ meal.protein }}г</span>
        <span v-if="meal.carbs" class="macro-chip">В: {{ meal.carbs }}г</span>
        <span v-if="meal.fat" class="macro-chip">Ж: {{ meal.fat }}г</span>
      </div>
    </div>

    <div class="meal-footer">
      <button class="recipe-btn" :disabled="isFetchingRecipe" @click="toggleRecipe">
        <div class="recipe-btn-left">
          <BookOpen :size="14" />
          <span>{{ isFetchingRecipe ? 'Завантаження...' : (isExpanded ? 'Сховати рецепт' : 'Подивитись рецепт') }}</span>
        </div>
        <ChevronRight :size="14" class="chev" :class="{ open: isExpanded }" />
      </button>
    </div>

    <div v-if="isExpanded && meal.steps && meal.steps.length > 0" class="recipe-steps fade-in">
      <p v-if="meal.description" class="meal-desc">{{ meal.description }}</p>
      <h5>Кроки приготування:</h5>
      <ol class="steps-list">
        <li v-for="(step, i) in meal.steps" :key="i">{{ step }}</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.meal-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-type {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-icon {
  color: var(--accent-orange);
}

.type-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.icon-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
  transition: var(--transition-fast);
}

.icon-btn:hover {
  color: var(--accent-orange);
  background: var(--accent-orange-bg);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.meal-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.ingredients-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.ing-tag {
  font-size: 0.72rem;
  background: var(--accent-blue-bg);
  border: 1px solid rgba(164, 225, 255, 0.3);
  color: var(--accent-blue);
  padding: 2px 6px;
  border-radius: 6px;
}

.macros-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.macro-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--status-warning);
  background: var(--status-warning-bg);
  padding: 2px 6px;
  border-radius: 4px;
}

.meal-footer {
  border-top: 1px solid var(--border-subtle);
  padding-top: 8px;
}

.recipe-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 0.85rem;
  color: var(--accent-orange);
  font-weight: 500;
  transition: var(--transition-fast);
}

.recipe-btn-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.recipe-btn:hover {
  color: var(--accent-orange-hover);
}

.chev {
  transition: transform 0.2s ease;
}

.chev.open {
  transform: rotate(90deg);
}

.recipe-steps {
  margin-top: 6px;
  padding: 10px 12px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.meal-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.steps-list {
  padding-left: 18px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
