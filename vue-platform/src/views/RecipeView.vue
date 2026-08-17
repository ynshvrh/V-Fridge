<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSavedRecipeStore, type SavedRecipe } from '@/stores/savedRecipes';
import { useNutritionStore } from '@/stores/nutrition';
import { useShoppingStore } from '@/stores/shopping';
import { useI18n } from '@/i18n';
import ChefChat from '@/components/chat/ChefChat.vue';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Flame, 
  Plus, 
  Check, 
  ShoppingBasket, 
  Loader2, 
  BookOpen, 
  X,
  ChefHat
} from '@lucide/vue';

const savedRecipeStore = useSavedRecipeStore();
const nutritionStore = useNutritionStore();
const shoppingStore = useShoppingStore();
const { t } = useI18n();

const showSavedDrawer = ref(false);
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
  if (!confirm(t('recipeDeleteConfirm') || 'Вилучити цей збережений рецепт?')) return;
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
    alert(err.error || 'Не вдалося записати в трекер.');
  } finally {
    loggingId.value = null;
  }
};

const handleImportIngredients = async (recipe: SavedRecipe) => {
  if (!recipe.ingredients || recipe.ingredients.length === 0) return;
  importingId.value = recipe.id;
  try {
    for (const ing of recipe.ingredients) {
      await shoppingStore.addItem({ name: ing, category: 'other' });
    }
    alert(t('ingredientsImportedSuccess') || `Інгредієнти успішно додано до списку покупок!`);
  } catch (err: any) {
    alert(err.error || 'Не вдалося експортувати інгредієнти.');
  } finally {
    importingId.value = null;
  }
};
</script>

<template>
  <div class="recipes-view fade-in">
    <!-- Header with Quick Action to Saved Recipes -->
    <header class="view-header">
      <div>
        <h2 class="view-title">{{ t('navChef') }}</h2>
        <p class="view-subtitle">{{ t('dashboardQuickChefDesc') }}</p>
      </div>

      <button
        class="btn-secondary btn-sm"
        :class="{ active: showSavedDrawer }"
        @click="showSavedDrawer = !showSavedDrawer"
      >
        <Bookmark :size="15" />
        <span>{{ t('savedRecipesTab') || 'Збережені рецепти' }}</span>
        <span v-if="savedRecipeStore.savedRecipes.length > 0" class="badge-count">
          {{ savedRecipeStore.savedRecipes.length }}
        </span>
      </button>
    </header>

    <!-- Main Content Area: Spacious AI Chat + Optional Saved Sidebar -->
    <div class="studio-layout">
      <!-- Chef Chat Studio (Takes maximum workspace) -->
      <div class="chat-main-area">
        <ChefChat />
      </div>

      <!-- Saved Recipes Side Panel (Desktop toggle / Drawer) -->
      <transition name="slide-panel">
        <aside v-if="showSavedDrawer" class="saved-sidebar nordic-card">
          <div class="saved-sidebar-header">
            <div class="sidebar-title-row">
              <Bookmark :size="16" />
              <h3>{{ t('savedRecipesTab') || 'Збережені рецепти' }}</h3>
            </div>
            <button class="close-sidebar-btn" @click="showSavedDrawer = false">
              <X :size="16" />
            </button>
          </div>

          <div class="saved-search-box">
            <Search :size="14" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="saved-search-input"
              :placeholder="t('searchPlaceholder') || 'Пошук рецептів...'"
            />
          </div>

          <div v-if="savedRecipeStore.loading && savedRecipeStore.savedRecipes.length === 0" class="loading-box">
            <Loader2 :size="24" class="spin-icon" />
          </div>

          <div v-else-if="filteredRecipes.length === 0" class="empty-saved-box">
            <BookOpen :size="28" class="empty-icon" />
            <p>{{ t('noSavedRecipes') || 'Немає збережених рецептів.' }}</p>
          </div>

          <div v-else class="saved-list">
            <div
              v-for="recipe in filteredRecipes"
              :key="recipe.id"
              class="saved-item-card"
              @click="openRecipeModal(recipe)"
            >
              <div class="saved-item-top">
                <h4 class="saved-item-name">{{ recipe.name }}</h4>
                <button
                  class="item-delete-btn"
                  title="Видалити"
                  @click.stop="handleDeleteRecipe(recipe.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </div>

              <p v-if="recipe.description" class="saved-item-desc">{{ recipe.description }}</p>

              <div class="saved-item-meta">
                <span class="meta-ing-count">{{ recipe.ingredients?.length || 0 }} інгредієнтів</span>
                <span v-if="recipe.calories > 0" class="meta-kcal">
                  <Flame :size="12" /> {{ recipe.calories }} кКал
                </span>
              </div>
            </div>
          </div>
        </aside>
      </transition>
    </div>

    <!-- Recipe Detail Modal -->
    <transition name="fade">
      <div v-if="selectedRecipe" class="modal-overlay" @click.self="selectedRecipe = null">
        <div class="modal-card nordic-card">
          <div class="modal-header">
            <div class="badge badge-ai">
              <ChefHat :size="12" />
              <span>Рецепт</span>
            </div>
            <button class="close-btn" @click="selectedRecipe = null">
              <X :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <h2 class="modal-recipe-title">{{ selectedRecipe.name }}</h2>
            <p v-if="selectedRecipe.description" class="modal-recipe-desc">{{ selectedRecipe.description }}</p>

            <!-- Nutrition bar -->
            <div v-if="selectedRecipe.calories > 0" class="nutrition-strip">
              <div class="nutr-stat">
                <span class="stat-label">Калорії</span>
                <strong class="stat-value">{{ selectedRecipe.calories }} кКал</strong>
              </div>
              <div class="nutr-stat">
                <span class="stat-label">Білки</span>
                <strong class="stat-value">{{ Math.round(selectedRecipe.protein) }}г</strong>
              </div>
              <div class="nutr-stat">
                <span class="stat-label">Жири</span>
                <strong class="stat-value">{{ Math.round(selectedRecipe.fat) }}г</strong>
              </div>
              <div class="nutr-stat">
                <span class="stat-label">Вуглеводи</span>
                <strong class="stat-value">{{ Math.round(selectedRecipe.carbs) }}г</strong>
              </div>
            </div>

            <!-- Action buttons inside modal -->
            <div class="modal-quick-actions">
              <button
                class="btn-secondary btn-sm flex-1"
                :disabled="loggingId === selectedRecipe.id"
                @click="handleLogToTracker(selectedRecipe)"
              >
                <Plus :size="14" />
                <span>Записати в калорії</span>
              </button>
              <button
                class="btn-secondary btn-sm flex-1"
                :disabled="importingId === selectedRecipe.id"
                @click="handleImportIngredients(selectedRecipe)"
              >
                <ShoppingBasket :size="14" />
                <span>В список покупок</span>
              </button>
            </div>

            <!-- Ingredients checklist -->
            <div v-if="selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0" class="ingredients-section">
              <h4 class="section-title">Інгредієнти ({{ selectedRecipe.ingredients.length }})</h4>
              <div class="ingredients-grid">
                <div
                  v-for="(ing, idx) in selectedRecipe.ingredients"
                  :key="idx"
                  :class="['ing-check-item', checkedIngredients[ing] ? 'checked' : '']"
                  @click="checkedIngredients[ing] = !checkedIngredients[ing]"
                >
                  <div class="check-box">
                    <Check v-if="checkedIngredients[ing]" :size="11" />
                  </div>
                  <span class="ing-name">{{ ing }}</span>
                </div>
              </div>
            </div>

            <!-- Cooking steps -->
            <div v-if="selectedRecipe.steps && selectedRecipe.steps.length > 0" class="steps-section">
              <h4 class="section-title">Кроки приготування</h4>
              <ol class="steps-list">
                <li v-for="(step, idx) in selectedRecipe.steps" :key="idx" class="step-item">
                  <span class="step-counter">{{ idx + 1 }}</span>
                  <p class="step-desc">{{ step }}</p>
                </li>
              </ol>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="btn-destructive btn-sm"
              :disabled="deletingId === selectedRecipe.id"
              @click="handleDeleteRecipe(selectedRecipe.id)"
            >
              <Trash2 :size="14" />
              <span>Видалити рецепт</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.recipes-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.view-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.view-subtitle {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.btn-sm {
  padding: 7px 12px;
  font-size: 0.82rem;
}

.badge-count {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 10px;
  background: var(--primary);
  color: var(--primary-foreground);
}

.studio-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
  position: relative;
}

.chat-main-area {
  flex: 1;
  min-width: 0;
}

/* Saved Sidebar */
.saved-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  min-height: 580px;
  overflow: hidden;
}

@media (max-width: 900px) {
  .saved-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 100vh;
    z-index: 150;
    box-shadow: var(--shadow-lg);
  }
}

.saved-sidebar-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
}

.close-sidebar-btn {
  color: var(--text-muted);
  padding: 2px;
}

.saved-search-box {
  margin: 10px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
}

.search-icon {
  color: var(--text-muted);
}

.saved-search-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 0.8rem;
  color: var(--text-primary);
}

.saved-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.saved-item-card {
  padding: 10px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: var(--transition-fast);
}

.saved-item-card:hover {
  background: var(--bg-subtle);
  border-color: var(--border-strong);
}

.saved-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.saved-item-name {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-delete-btn {
  color: var(--text-muted);
  padding: 2px;
  border-radius: 2px;
}

.item-delete-btn:hover {
  color: var(--status-expired);
}

.saved-item-desc {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.saved-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.meta-kcal {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--status-warning);
  font-weight: 600;
}

.loading-box, .empty-saved-box {
  padding: 30px 14px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-recipe-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-recipe-desc {
  font-size: 0.84rem;
  color: var(--text-secondary);
  margin-top: -6px;
}

.nutrition-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px;
  background: var(--bg-subtle);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-value {
  font-size: 0.85rem;
  font-weight: 600;
}

.modal-quick-actions {
  display: flex;
  gap: 8px;
}

.flex-1 {
  flex: 1;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.ingredients-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

@media (min-width: 480px) {
  .ingredients-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.ing-check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  font-size: 0.82rem;
  cursor: pointer;
}

.ing-check-item.checked {
  opacity: 0.5;
}

.ing-check-item.checked .ing-name {
  text-decoration: line-through;
}

.check-box {
  width: 15px;
  height: 15px;
  border-radius: 3px;
  border: 1px solid var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ing-check-item.checked .check-box {
  background: var(--status-fresh);
  border-color: var(--status-fresh);
  color: #fff;
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
  gap: 10px;
  font-size: 0.84rem;
}

.step-counter {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.step-desc {
  margin: 0;
  line-height: 1.4;
}

.modal-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}
</style>
