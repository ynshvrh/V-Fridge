<script setup lang="ts">
import { ref } from 'vue';
import type { ParsedRecipe } from '@/composables/useRecipeParser';
import { 
  Bookmark, 
  Utensils, 
  Flame, 
  Check, 
  Copy,
  ChevronDown,
  ChevronUp
} from '@lucide/vue';

const props = defineProps<{
  recipe: ParsedRecipe;
  isSaved?: boolean;
}>();

const emit = defineEmits<{
  (e: 'cook', recipe: ParsedRecipe): void;
  (e: 'save', recipe: ParsedRecipe): void;
}>();

const showSteps = ref(true);
const isCopied = ref(false);

const handleCopy = async () => {
  const text = `${props.recipe.name}\n${props.recipe.description}\n\nІнгредієнти:\n${props.recipe.ingredients.map(i => `- ${i}`).join('\n')}\n\nКроки:\n${props.recipe.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`;
  await navigator.clipboard.writeText(text);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 1500);
};
</script>

<template>
  <div class="recipe-card nordic-card">
    <div class="recipe-header">
      <div class="recipe-title-group">
        <span class="recipe-badge">Рецепт від Шефа</span>
        <h4 class="recipe-title">{{ recipe.name }}</h4>
        <p v-if="recipe.description" class="recipe-desc">{{ recipe.description }}</p>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn-icon"
          :title="isCopied ? 'Скопійовано' : 'Скопіювати рецепт'"
          @click="handleCopy"
        >
          <Check v-if="isCopied" :size="15" class="text-success" />
          <Copy v-else :size="15" />
        </button>

        <button
          type="button"
          class="btn-icon"
          :class="{ active: isSaved }"
          :title="isSaved ? 'Збережено' : 'Зберегти рецепт'"
          @click="emit('save', recipe)"
        >
          <Bookmark :size="15" />
        </button>
      </div>
    </div>

    <!-- Macros Badges -->
    <div class="macros-row">
      <div v-if="recipe.calories" class="macro-badge macro-cal">
        <Flame :size="12" />
        <span>{{ recipe.calories }} кКал</span>
      </div>
      <div v-if="recipe.protein" class="macro-badge">
        <span>Б: {{ recipe.protein }}г</span>
      </div>
      <div v-if="recipe.fat" class="macro-badge">
        <span>Ж: {{ recipe.fat }}г</span>
      </div>
      <div v-if="recipe.carbs" class="macro-badge">
        <span>В: {{ recipe.carbs }}г</span>
      </div>
      <div v-if="recipe.portions" class="macro-badge macro-servings">
        <span>{{ recipe.portions }} порц.</span>
      </div>
    </div>

    <!-- Ingredients list -->
    <div v-if="recipe.ingredients.length > 0" class="recipe-section">
      <h5 class="section-title">Інгредієнти:</h5>
      <ul class="ingredients-list">
        <li v-for="(ing, idx) in recipe.ingredients" :key="idx" class="ingredient-item">
          <span class="bullet">•</span>
          <span>{{ ing }}</span>
        </li>
      </ul>
    </div>

    <!-- Cooking Steps -->
    <div v-if="recipe.steps.length > 0" class="recipe-section">
      <div class="section-header-toggle" @click="showSteps = !showSteps">
        <h5 class="section-title">Приготування ({{ recipe.steps.length }} кр.):</h5>
        <button type="button" class="toggle-btn">
          <ChevronUp v-if="showSteps" :size="14" />
          <ChevronDown v-else :size="14" />
        </button>
      </div>

      <ol v-if="showSteps" class="steps-list">
        <li v-for="(step, idx) in recipe.steps" :key="idx" class="step-item">
          <span class="step-num">{{ idx + 1 }}</span>
          <span class="step-text">{{ step }}</span>
        </li>
      </ol>
    </div>

    <!-- Action Bar -->
    <div class="recipe-actions">
      <button
        type="button"
        class="btn-cook"
        @click="emit('cook', recipe)"
      >
        <Utensils :size="15" />
        <span>Приготувати ({{ recipe.portions || 2 }} порц.)</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.recipe-card {
  margin-top: 10px;
  padding: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.recipe-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recipe-badge {
  display: inline-block;
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  background: var(--primary-subtle, rgba(224, 90, 71, 0.12));
  color: var(--primary);
}

.recipe-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.recipe-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.btn-icon {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  padding: 6px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.btn-icon:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.btn-icon.active {
  color: var(--primary);
  border-color: var(--primary);
  background: var(--primary-subtle, rgba(224, 90, 71, 0.1));
}

.macros-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.macro-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.macro-cal {
  color: #e05a47;
  background: rgba(224, 90, 71, 0.08);
  border-color: rgba(224, 90, 71, 0.2);
}

.macro-servings {
  color: var(--text-muted);
}

.recipe-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.section-header-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
}

.ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ingredient-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.bullet {
  color: var(--primary);
  font-weight: bold;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-primary);
  flex-shrink: 0;
  margin-top: 1px;
}

.recipe-actions {
  display: flex;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.btn-cook {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--radius-xs);
  background: var(--primary);
  color: white;
  font-size: 0.82rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-cook:hover {
  background: var(--primary-hover);
}
</style>
