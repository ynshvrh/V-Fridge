<script setup lang="ts">
import { ref, computed } from 'vue';
import { type MealPlanMeal, usePlannerStore } from '@/stores/planner';
import { useProductStore } from '@/stores/product';
import { useShoppingStore } from '@/stores/shopping';
import { 
  RefreshCw, 
  BookOpen, 
  Flame, 
  ChevronRight, 
  Plus, 
  Check, 
  ShoppingBag, 
  Utensils, 
  Loader2 
} from '@lucide/vue';

const props = defineProps<{
  meal: MealPlanMeal;
}>();

const plannerStore = usePlannerStore();
const productStore = useProductStore();
const shoppingStore = useShoppingStore();

const isExpanded = ref(false);
const isRegenerating = ref(false);
const isFetchingRecipe = ref(false);
const isAddingToShopping = ref(false);
const addedToShopping = ref(false);
const isCooking = ref(false);
const cookSuccess = ref(false);

const mealTypeLabels: Record<string, { label: string }> = {
  breakfast: { label: 'Сніданок' },
  lunch: { label: 'Обід' },
  dinner: { label: 'Вечеря' },
  snack: { label: 'Перекус' }
};

const mealTypeInfo = computed(() => {
  const t = (props.meal.mealType || '').toLowerCase();
  return mealTypeLabels[t] || { label: props.meal.mealType || 'Страва' };
});

const isIngredientInFridge = (ing: string): boolean => {
  const clean = ing.toLowerCase().trim();
  return productStore.products.some(p => {
    const pName = p.name.toLowerCase().trim();
    return clean.includes(pName) || pName.includes(clean);
  });
};

const missingIngredients = computed(() => {
  if (!props.meal.ingredients || props.meal.ingredients.length === 0) return [];
  return props.meal.ingredients.filter(ing => !isIngredientInFridge(ing));
});

const toggleRecipe = async () => {
  if (!isExpanded.value && (!props.meal.steps || props.meal.steps.length === 0)) {
    isFetchingRecipe.value = true;
    await plannerStore.fetchRecipe(props.meal.day, props.meal.mealType);
    isFetchingRecipe.value = false;
  }
  isExpanded.value = !isExpanded.value;
};

const handleRegenerate = async () => {
  isRegenerating.value = true;
  await plannerStore.regenerateMeal(props.meal.day, props.meal.mealType);
  isRegenerating.value = false;
};

const handleAddMissingToShopping = async () => {
  if (missingIngredients.value.length === 0) return;
  isAddingToShopping.value = true;
  try {
    for (const ing of missingIngredients.value) {
      await shoppingStore.addItem({ name: ing, category: 'other' });
    }
    await shoppingStore.fetchShoppingItems(true);
    addedToShopping.value = true;
    setTimeout(() => {
      addedToShopping.value = false;
    }, 2500);
  } catch (err: any) {
    alert(err.error || 'Не вдалося додати до списку покупок.');
  } finally {
    isAddingToShopping.value = false;
  }
};

const handleCookMeal = async () => {
  isCooking.value = true;
  try {
    const res = await productStore.cookRecipe({
      name: props.meal.name,
      description: props.meal.description,
      portions: 2,
      ingredients: props.meal.ingredients,
      caloriesPerPortion: props.meal.calories,
      proteinPerPortion: props.meal.protein,
      fatPerPortion: props.meal.fat,
      carbsPerPortion: props.meal.carbs,
      expiryDays: 3,
      ignoreOptionalMissing: true
    });
    if (res) {
      cookSuccess.value = true;
      setTimeout(() => {
        cookSuccess.value = false;
      }, 2500);
    }
  } catch (err: any) {
    alert(err.error || 'Не вдалося приготувати страву.');
  } finally {
    isCooking.value = false;
  }
};
</script>

<template>
  <div class="nordic-card meal-card fade-in" :class="{ expanded: isExpanded }">
    <!-- Card Header -->
    <div class="meal-header">
      <div class="header-type">
        <span class="type-label">{{ mealTypeInfo.label }}</span>
      </div>

      <button class="icon-btn" title="Оновити цю страву" :disabled="isRegenerating" @click="handleRegenerate">
        <RefreshCw :size="14" :class="{ spin: isRegenerating }" />
      </button>
    </div>

    <!-- Main Title & Macros -->
    <div class="meal-main">
      <h4 class="meal-name">{{ meal.name }}</h4>

      <div v-if="meal.calories" class="macros-row">
        <span class="macro-chip"><Flame :size="12" /> {{ meal.calories }} ккал</span>
        <span v-if="meal.protein" class="macro-chip">Б: {{ meal.protein }}г</span>
        <span v-if="meal.fat" class="macro-chip">Ж: {{ meal.fat }}г</span>
        <span v-if="meal.carbs" class="macro-chip">В: {{ meal.carbs }}г</span>
      </div>
    </div>

    <!-- Toggle Action -->
    <div class="meal-footer">
      <button class="recipe-btn" :disabled="isFetchingRecipe" @click="toggleRecipe">
        <div class="recipe-btn-left">
          <BookOpen :size="14" />
          <span>{{ isFetchingRecipe ? 'Завантаження рецепта...' : (isExpanded ? 'Згорнути рецепт' : 'Подивитись рецепт та інгредієнти') }}</span>
        </div>
        <ChevronRight :size="14" class="chev" :class="{ open: isExpanded }" />
      </button>
    </div>

    <!-- Expanded Recipe Details -->
    <div v-if="isExpanded" class="recipe-details fade-in">
      <p v-if="meal.description" class="meal-desc">{{ meal.description }}</p>

      <!-- Ingredients Section -->
      <div class="details-section">
        <div class="section-heading-row">
          <h5>Інгредієнти ({{ meal.ingredients?.length || 0 }}):</h5>
          <span v-if="missingIngredients.length === 0" class="status-tag-all-fresh">
            <Check :size="12" /> Всі є в наявності
          </span>
          <span v-else class="status-tag-missing">
            Бракує: {{ missingIngredients.length }}
          </span>
        </div>

        <div class="ingredients-list-grid">
          <div
            v-for="(ing, idx) in meal.ingredients"
            :key="idx"
            class="ing-item-pill"
            :class="{ 'in-fridge': isIngredientInFridge(ing), 'is-missing': !isIngredientInFridge(ing) }"
          >
            <Check v-if="isIngredientInFridge(ing)" :size="12" class="ing-status-icon fresh" />
            <ShoppingBag v-else :size="12" class="ing-status-icon warn" />
            <span>{{ ing }}</span>
          </div>
        </div>

        <!-- Per-Meal Action Buttons -->
        <div class="meal-actions-row">
          <button
            v-if="missingIngredients.length > 0"
            class="btn-secondary btn-sm"
            :disabled="isAddingToShopping || addedToShopping"
            @click="handleAddMissingToShopping"
          >
            <Check v-if="addedToShopping" :size="13" />
            <Plus v-else :size="13" />
            <span>{{ addedToShopping ? 'Додано в покупки!' : `В покупки (${missingIngredients.length})` }}</span>
          </button>

          <button
            class="btn-primary btn-sm"
            :disabled="isCooking || cookSuccess"
            @click="handleCookMeal"
          >
            <Loader2 v-if="isCooking" :size="13" class="spin" />
            <Check v-else-if="cookSuccess" :size="13" />
            <Utensils v-else :size="13" />
            <span>{{ cookSuccess ? 'Приготовано!' : 'Приготувати страву' }}</span>
          </button>
        </div>
      </div>

      <!-- Steps Section -->
      <div v-if="meal.steps && meal.steps.length > 0" class="details-section steps-block">
        <h5>Кроки приготування:</h5>
        <ol class="steps-list">
          <li v-for="(step, i) in meal.steps" :key="i">
            <span class="step-num">{{ i + 1 }}</span>
            <span class="step-text">{{ step }}</span>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meal-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: var(--transition-fast);
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

.type-emoji {
  font-size: 0.95rem;
}

.type-label {
  font-size: 0.72rem;
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

.meal-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meal-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.35;
}

.macros-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.macro-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  padding: 2px 7px;
  border-radius: var(--radius-xs);
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
  font-size: 0.82rem;
  color: var(--text-primary);
  font-weight: 600;
  transition: var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 0;
}

.recipe-btn-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary);
}

.recipe-btn:hover .recipe-btn-left {
  opacity: 0.85;
}

.chev {
  transition: transform 0.2s ease;
  color: var(--text-muted);
}

.chev.open {
  transform: rotate(90deg);
}

.recipe-details {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.meal-desc {
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.details-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-heading-row h5,
.steps-block h5 {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}

.status-tag-all-fresh {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--status-fresh);
}

.status-tag-missing {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--status-warning);
}

.ingredients-list-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ing-item-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  font-size: 0.78rem;
  font-weight: 500;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-primary);
}

.ing-item-pill.in-fridge {
  background: var(--status-fresh-bg);
  border-color: var(--status-fresh-border);
}

.ing-item-pill.is-missing {
  background: var(--status-warning-bg);
  border-color: var(--status-warning-border);
}

.ing-status-icon.fresh {
  color: var(--status-fresh);
}

.ing-status-icon.warn {
  color: var(--status-warning);
}

.meal-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.78rem;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.steps-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.72rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.step-text {
  flex: 1;
}
</style>
