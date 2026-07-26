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

      <button class="icon-btn" title="Regenerate this meal" :disabled="isRegenerating" @click="handleRegenerate">
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
        <span class="macro-chip"><Flame :size="12" /> {{ meal.calories }} kcal</span>
        <span v-if="meal.protein" class="macro-chip">P: {{ meal.protein }}g</span>
        <span v-if="meal.carbs" class="macro-chip">C: {{ meal.carbs }}g</span>
        <span v-if="meal.fat" class="macro-chip">F: {{ meal.fat }}g</span>
      </div>
    </div>

    <div class="meal-footer">
      <button class="recipe-btn" :disabled="isFetchingRecipe" @click="toggleRecipe">
        <BookOpen :size="14" />
        <span>{{ isFetchingRecipe ? 'Loading recipe...' : (isExpanded ? 'Hide Recipe' : 'View Recipe & Steps') }}</span>
        <ChevronRight :size="14" class="chev" :class="{ open: isExpanded }" />
      </button>
    </div>

    <div v-if="isExpanded && meal.steps && meal.steps.length > 0" class="recipe-steps fade-in">
      <p v-if="meal.description" class="meal-desc">{{ meal.description }}</p>
      <h5>Cooking Steps:</h5>
      <ol class="steps-list">
        <li v-for="(step, i) in meal.steps" :key="i">{{ step }}</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.meal-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  color: var(--accent-purple-hover);
}

.type-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.icon-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
}

.icon-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.meal-name {
  font-size: 1.05rem;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.ingredients-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.ing-tag {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 10px;
}

.macros-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.macro-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--accent-amber);
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.meal-footer {
  border-top: 1px solid var(--border-subtle);
  padding-top: 10px;
}

.recipe-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 0.85rem;
  color: var(--accent-purple-hover);
  font-weight: 500;
}

.chev {
  transition: transform 0.2s ease;
}

.chev.open {
  transform: rotate(90deg);
}

.recipe-steps {
  margin-top: 8px;
  padding: 12px;
  background: rgba(15, 14, 23, 0.6);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.meal-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.steps-list {
  padding-left: 20px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
