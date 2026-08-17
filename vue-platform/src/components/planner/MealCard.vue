<script setup lang="ts">
import { ref } from 'vue';
import { type MealPlanMeal, usePlannerStore } from '@/stores/planner';
import { useI18n } from '@/i18n';
import { ChefHat, RefreshCw, BookOpen, Flame, ChevronRight } from '@lucide/vue';

const props = defineProps<{
  meal: MealPlanMeal;
}>();

const plannerStore = usePlannerStore();
const { t } = useI18n();

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
  <div class="nordic-card meal-card fade-in">
    <div class="meal-header">
      <div class="header-type">
        <ChefHat :size="14" class="type-icon" />
        <span class="type-label">{{ meal.mealType }}</span>
      </div>

      <button class="icon-btn" :title="t('plannerRegenerateMeal') || 'Оновити цю страву'" :disabled="isRegenerating" @click="handleRegenerate">
        <RefreshCw :size="13" :class="{ spin: isRegenerating }" />
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
        <span class="macro-chip"><Flame :size="11" /> {{ meal.calories }} ккал</span>
        <span v-if="meal.protein" class="macro-chip">Б: {{ meal.protein }}г</span>
        <span v-if="meal.carbs" class="macro-chip">В: {{ meal.carbs }}г</span>
        <span v-if="meal.fat" class="macro-chip">Ж: {{ meal.fat }}г</span>
      </div>
    </div>

    <div class="meal-footer">
      <button class="recipe-btn" :disabled="isFetchingRecipe" @click="toggleRecipe">
        <div class="recipe-btn-left">
          <BookOpen :size="13" />
          <span>{{ isFetchingRecipe ? (t('actionLoading') || 'Завантаження...') : (isExpanded ? (t('plannerHideRecipe') || 'Сховати рецепт') : (t('plannerViewRecipe') || 'Подивитись рецепт')) }}</span>
        </div>
        <ChevronRight :size="13" class="chev" :class="{ open: isExpanded }" />
      </button>
    </div>

    <div v-if="isExpanded && meal.steps && meal.steps.length > 0" class="recipe-steps fade-in">
      <p v-if="meal.description" class="meal-desc">{{ meal.description }}</p>
      <h5>{{ t('recipeSteps') || 'Кроки приготування' }}:</h5>
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
  color: var(--text-muted);
}

.type-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}

.icon-btn {
  color: var(--text-muted);
  padding: 3px;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.icon-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
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
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-subtle);
  padding: 2px 5px;
  border-radius: 3px;
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
  color: var(--text-secondary);
  font-weight: 500;
  transition: var(--transition-fast);
}

.recipe-btn-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.recipe-btn:hover {
  color: var(--text-primary);
}

.chev {
  transition: transform 0.2s ease;
}

.chev.open {
  transform: rotate(90deg);
}

.recipe-steps {
  margin-top: 6px;
  padding: 10px;
  background: var(--bg-subtle);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.meal-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.recipe-steps h5 {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.steps-list {
  padding-left: 16px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
