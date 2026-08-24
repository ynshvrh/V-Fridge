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
  color: var(--primary);
}

.type-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}

.icon-btn {
  color: var(--text-muted);
  padding: 4px;
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

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.meal-name {
  font-size: 0.95rem;
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
  font-size: 0.7rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

.macros-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.macro-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
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
  font-size: 0.8rem;
  color: var(--text-primary);
  font-weight: 500;
  transition: var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 0;
}

.recipe-btn-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.recipe-btn:hover {
  color: var(--text-secondary);
}

.chev {
  transition: transform 0.2s ease;
  color: var(--text-muted);
}

.chev.open {
  transform: rotate(90deg);
}

.recipe-steps {
  margin-top: 6px;
  padding: 10px 12px;
  background: var(--bg-subtle);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.meal-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.recipe-steps h5 {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.steps-list {
  padding-left: 18px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
