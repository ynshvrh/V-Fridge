<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSavedRecipeStore, type SavedRecipe } from '@/stores/savedRecipes';
import { useNutritionStore } from '@/stores/nutrition';
import { api } from '@/api/client';
import ChefChat from '@/components/chat/ChefChat.vue';
import { 
  ChefHat, 
  Bookmark, 
  Search, 
  Trash2, 
  Flame, 
  Plus, 
  Check, 
  ShoppingBasket, 
  Loader2, 
  BookOpen, 
  X 
} from '@lucide/vue';

const savedRecipeStore = useSavedRecipeStore();
const nutritionStore = useNutritionStore();

const activeTab = ref<'chat' | 'saved'>('chat');
const searchQuery = ref('');
const selectedRecipe = ref<SavedRecipe | null>(null);
const checkedIngredients = ref<Record<string, boolean>>({});

const deletingId = ref<number | null>(null);
const loggingId = ref<number | null>(null);
const importingId = ref<number | null>(null);

onMounted(async () => {
  await savedRecipeStore.fetchSavedRecipes();
});

const filteredRecipes = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return savedRecipeStore.savedRecipes;
  return savedRecipeStore.savedRecipes.filter((r) => {
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (Array.isArray(r.ingredients) && r.ingredients.some((i) => i.toLowerCase().includes(q)))
    );
  });
});

const openRecipeModal = (recipe: SavedRecipe) => {
  selectedRecipe.value = recipe;
  checkedIngredients.value = {};
};

const handleDeleteRecipe = async (id: number) => {
  if (!confirm('Вилучити цей збережений рецепт?')) return;
  deletingId.value = id;
  try {
    await savedRecipeStore.deleteSavedRecipe(id);
    if (selectedRecipe.value?.id === id) {
      selectedRecipe.value = null;
    }
  } finally {
    deletingId.value = null;
  }
};

const handleLogToTracker = async (recipe: SavedRecipe) => {
  loggingId.value = recipe.id;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    await nutritionStore.logFood({
      date: todayStr,
      mealType: 'lunch',
      foodName: recipe.name,
      quantity: 1,
      unit: 'порція',
      calories: recipe.calories || 0,
      protein: Number(recipe.protein) || 0,
      fat: Number(recipe.fat) || 0,
      carbs: Number(recipe.carbs) || 0
    });
    alert(`Страва "${recipe.name}" успішно додана у щоденник калорій!`);
  } catch (err: any) {
    alert(err.error || 'Не вдалося зберегти в трекер.');
  } finally {
    loggingId.value = null;
  }
};

const handleImportIngredients = async (recipe: SavedRecipe) => {
  if (!recipe.ingredients || recipe.ingredients.length === 0) return;
  importingId.value = recipe.id;
  try {
    const gapItems = recipe.ingredients.map((ing) => ({
      name: ing,
      quantity: null,
      unit: null,
      category: 'other'
    }));
    const resp = await api.fetch<{ created: number; skipped: number }>('/meal-plan/import-gaps', {
      method: 'POST',
      body: JSON.stringify({ items: gapItems })
    });
    alert(`Додано в список покупок: ${resp.created} інгредієнтів (пропущено як існуючі: ${resp.skipped}).`);
  } catch (err: any) {
    alert(err.error || 'Не вдалося експортувати інгредієнти у список покупок.');
  } finally {
    importingId.value = null;
  }
};
</script>

<template>
  <div class="recipe-page">
    <!-- Header & Tab bar -->
    <div class="top-nav-bar">
      <div class="tab-buttons">
        <button
          :class="['tab-btn', activeTab === 'chat' ? 'active' : '']"
          @click="activeTab = 'chat'"
        >
          <ChefHat :size="18" />
          <span>AI Шеф-чат</span>
        </button>

        <button
          :class="['tab-btn', activeTab === 'saved' ? 'active' : '']"
          @click="activeTab = 'saved'"
        >
          <Bookmark :size="18" />
          <span>Збережені рецепти</span>
          <span v-if="savedRecipeStore.savedRecipes.length > 0" class="counter-badge">
            {{ savedRecipeStore.savedRecipes.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Tab 1: AI Chef Chat -->
    <div v-if="activeTab === 'chat'" class="tab-content">
      <ChefChat />
    </div>

    <!-- Tab 2: Saved Recipes Gallery -->
    <div v-else class="tab-content saved-recipes-tab">
      <div class="search-bar-row">
        <div class="search-input-wrapper">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Пошук збережених рецептів за назвою чи інгредієнтом..."
          />
        </div>
        <span class="count-text">Збережено: {{ filteredRecipes.length }}</span>
      </div>

      <div v-if="savedRecipeStore.loading && savedRecipeStore.savedRecipes.length === 0" class="loading-state">
        <Loader2 :size="32" class="animate-spin orange-icon" />
      </div>

      <div v-else-if="filteredRecipes.length === 0" class="empty-card card">
        <BookOpen :size="40" class="empty-icon" />
        <h3>Немає збережених рецептів</h3>
        <p>Під час спілкування з AI Шефом натисніть кнопку "Зберегти рецепт", щоб вони з'явилися тут.</p>
      </div>

      <div v-else class="recipes-grid">
        <div
          v-for="recipe in filteredRecipes"
          :key="recipe.id"
          class="recipe-grid-card card"
          @click="openRecipeModal(recipe)"
        >
          <div class="card-top">
            <span class="recipe-badge">
              <Bookmark :size="12" />
              Рецепт
            </span>
            <span v-if="recipe.calories > 0" class="calories-badge">
              <Flame :size="12" />
              {{ recipe.calories }} кКал
            </span>
          </div>

          <h4 class="card-title">{{ recipe.name }}</h4>
          <p v-if="recipe.description" class="card-desc">{{ recipe.description }}</p>

          <div class="card-footer">
            <span>{{ recipe.ingredients?.length || 0 }} інгредієнтів</span>
            <button
              class="delete-btn"
              title="Вилучити рецепт"
              @click.stop="handleDeleteRecipe(recipe.id)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Recipe Details Sheet -->
    <transition name="fade">
      <div v-if="selectedRecipe" class="modal-overlay" @click.self="selectedRecipe = null">
        <div class="drawer-modal">
          <div class="drawer-header">
            <div class="badge">
              <Bookmark :size="14" />
              <span>Збережений рецепт</span>
            </div>
            <button class="close-btn" @click="selectedRecipe = null">
              <X :size="20" />
            </button>
          </div>

          <div class="drawer-body">
            <h2 class="recipe-modal-title">{{ selectedRecipe.name }}</h2>
            <p v-if="selectedRecipe.description" class="recipe-modal-desc">{{ selectedRecipe.description }}</p>

            <!-- Nutritional Info & Log Button -->
            <div v-if="selectedRecipe.calories > 0" class="nutrition-block">
              <div class="nutr-header">
                <span class="nutr-title">
                  <Flame :size="16" class="orange-icon" /> Поживна цінність
                </span>
                <span class="nutr-kcal">{{ selectedRecipe.calories }} кКал</span>
              </div>

              <div class="macros-row">
                <div class="macro-item">
                  <span class="m-label prot">Білки</span>
                  <span class="m-val">{{ Math.round(selectedRecipe.protein) }}г</span>
                </div>
                <div class="macro-item">
                  <span class="m-label fat">Жири</span>
                  <span class="m-val">{{ Math.round(selectedRecipe.fat) }}г</span>
                </div>
                <div class="macro-item">
                  <span class="m-label carbs">Вуглеводи</span>
                  <span class="m-val">{{ Math.round(selectedRecipe.carbs) }}г</span>
                </div>
              </div>

              <button
                class="btn-primary full-btn"
                :disabled="loggingId === selectedRecipe.id"
                @click="handleLogToTracker(selectedRecipe)"
              >
                <Loader2 v-if="loggingId === selectedRecipe.id" :size="16" class="animate-spin" />
                <Plus v-else :size="16" />
                <span>Записати в Трекер калорій</span>
              </button>
            </div>

            <!-- Ingredients Checklist -->
            <div v-if="selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0" class="ingredients-block">
              <div class="sec-header">
                <span>Інгредієнти</span>
                <button
                  class="import-btn"
                  :disabled="importingId === selectedRecipe.id"
                  @click="handleImportIngredients(selectedRecipe)"
                >
                  <Loader2 v-if="importingId === selectedRecipe.id" :size="14" class="animate-spin" />
                  <ShoppingBasket v-else :size="14" />
                  <span>В список покупок</span>
                </button>
              </div>

              <div class="ingredients-list">
                <div
                  v-for="(ing, idx) in selectedRecipe.ingredients"
                  :key="idx"
                  :class="['ing-item', checkedIngredients[ing] ? 'checked' : '']"
                  @click="checkedIngredients[ing] = !checkedIngredients[ing]"
                >
                  <div class="checkbox">
                    <Check v-if="checkedIngredients[ing]" :size="12" />
                  </div>
                  <span class="ing-text">{{ ing }}</span>
                </div>
              </div>
            </div>

            <!-- Cooking Steps Timeline -->
            <div v-if="selectedRecipe.steps && selectedRecipe.steps.length > 0" class="steps-block">
              <div class="sec-header">Кроки приготування</div>
              <ol class="steps-timeline">
                <li v-for="(step, idx) in selectedRecipe.steps" :key="idx" class="timeline-step">
                  <div class="step-num">{{ idx + 1 }}</div>
                  <p class="step-text">{{ step }}</p>
                </li>
              </ol>
            </div>
          </div>

          <div class="drawer-footer">
            <button
              class="btn-danger full-btn"
              :disabled="deletingId === selectedRecipe.id"
              @click="handleDeleteRecipe(selectedRecipe.id)"
            >
              <Trash2 :size="16" />
              <span>Вилучити рецепт</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.recipe-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 6px;
}

.tab-buttons {
  display: flex;
  gap: 6px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 700;
  transition: var(--transition-fast);
}

.tab-btn.active {
  background: var(--accent-orange);
  color: #ffffff;
  box-shadow: 0 2px 10px var(--accent-orange-glow);
}

.counter-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 10px;
}

.saved-recipes-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.search-icon {
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
}

.count-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-card);
}

.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: 12px;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.recipe-grid-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: var(--transition-fast);
}

.recipe-grid-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent-orange);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.recipe-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--accent-orange);
}

.calories-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 800;
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
  padding: 2px 8px;
  border-radius: 12px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.card-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-bottom: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border-subtle);
  padding-top: 10px;
}

.delete-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: 6px;
  transition: var(--transition-fast);
}

.delete-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
}

/* Drawer modal for details */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
}

.drawer-modal {
  width: 100%;
  max-width: 440px;
  height: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-card);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--accent-orange);
}

.close-btn {
  color: var(--text-secondary);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recipe-modal-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-primary);
}

.recipe-modal-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: -12px 0 0 0;
}

.nutrition-block {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nutr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nutr-title {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nutr-kcal {
  font-size: 0.9rem;
  font-weight: 900;
  color: var(--accent-orange);
}

.macros-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  text-align: center;
}

.macro-item {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px;
}

.m-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
}

.m-label.prot { color: #10b981; }
.m-label.fat { color: #f59e0b; }
.m-label.carbs { color: #06b6d4; }

.m-val {
  font-size: 0.9rem;
  font-weight: 800;
}

.full-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  padding: 10px;
  border-radius: var(--radius-md);
  background: var(--accent-orange);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.85rem;
}

.btn-danger {
  padding: 10px;
  border-radius: var(--radius-md);
  background: var(--status-expired-bg);
  color: var(--status-expired);
  font-weight: 700;
  font-size: 0.85rem;
}

.sec-header {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-orange);
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ing-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.ing-item.checked {
  opacity: 0.6;
}

.ing-item.checked .ing-text {
  text-decoration: line-through;
}

.checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ing-item.checked .checkbox {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}

.steps-timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-step {
  display: flex;
  gap: 12px;
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-text {
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
}

.orange-icon {
  color: var(--accent-orange);
}
</style>
