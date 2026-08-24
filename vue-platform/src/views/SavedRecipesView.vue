<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSavedRecipeStore, type SavedRecipe } from '@/stores/savedRecipes';
import { useNutritionStore } from '@/stores/nutrition';
import { useShoppingStore } from '@/stores/shopping';
import { useProductStore } from '@/stores/product';
import { 
  Search, 
  Trash2, 
  Flame, 
  Plus, 
  Check, 
  ShoppingBasket, 
  Loader2, 
  BookOpen, 
  X,
  ChefHat,
  Sparkles,
  Utensils
} from '@lucide/vue';

const router = useRouter();
const savedRecipeStore = useSavedRecipeStore();
const nutritionStore = useNutritionStore();
const shoppingStore = useShoppingStore();
const productStore = useProductStore();

const searchQuery = ref('');
const selectedRecipe = ref<SavedRecipe | null>(null);
const checkedIngredients = ref<Record<string, boolean>>({});

const deletingId = ref<number | null>(null);
const loggingId = ref<number | null>(null);
const importingId = ref<number | null>(null);
const cookingId = ref<number | null>(null);

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
    for (const ing of recipe.ingredients) {
      await shoppingStore.addItem({ name: ing, category: 'other' });
    }
    alert(`Інгредієнти рецепта "${recipe.name}" додано до списку покупок!`);
  } catch (err: any) {
    alert(err.error || 'Не вдалося експортувати інгредієнти.');
  } finally {
    importingId.value = null;
  }
};

const handleCookSavedRecipe = async (recipe: SavedRecipe) => {
  cookingId.value = recipe.id;
  try {
    const res = await productStore.cookRecipe({
      name: recipe.name,
      description: recipe.description,
      portions: 2,
      ingredients: recipe.ingredients,
      caloriesPerPortion: recipe.calories,
      proteinPerPortion: Number(recipe.protein) || 0,
      fatPerPortion: Number(recipe.fat) || 0,
      carbsPerPortion: Number(recipe.carbs) || 0,
      expiryDays: 3,
      savedRecipeId: recipe.id
    });
    if (res) {
      alert(`Страва "${recipe.name}" приготована! Інгредієнти списано з холодильника, а контейнер додано на полицю.`);
    }
  } catch (err: any) {
    alert(err.error || 'Не вдалося списати інгредієнти.');
  } finally {
    cookingId.value = null;
  }
};
</script>

<template>
  <div class="saved-recipes-page fade-in">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h2 class="section-heading">Збережені рецепти</h2>
        <p class="section-subheading">Ваша персональна кулінарна книга та обрані страви від AI Шефа</p>
      </div>

      <div class="header-actions">
        <button class="btn-primary btn-sm" @click="router.push('/recipes')">
          <Sparkles :size="15" />
          <span>Згенерувати новий рецепт</span>
        </button>
      </div>
    </header>

    <!-- Search Bar -->
    <div class="search-bar-row">
      <div class="search-input-box">
        <Search :size="15" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Пошук збережених рецептів за назвою або інгредієнтом..."
        />
      </div>
    </div>

    <!-- Content -->
    <div v-if="savedRecipeStore.loading && savedRecipeStore.savedRecipes.length === 0" class="loading-state nordic-card">
      <Loader2 :size="28" class="spin-icon" />
      <p>Завантаження збережених рецептів...</p>
    </div>

    <div v-else-if="filteredRecipes.length === 0" class="empty-state nordic-card">
      <div class="empty-icon-box">
        <BookOpen :size="24" />
      </div>
      <h3>{{ searchQuery ? 'Нічого не знайдено' : 'Немає збережених рецептів' }}</h3>
      <p>{{ searchQuery ? 'Спробуйте змінити пошуковий запит.' : 'Зберігайте вподобані рецепти під час спілкування з AI Шефом, і вони з\'являться тут.' }}</p>
      <button v-if="!searchQuery" class="btn-primary" style="margin-top: 14px;" @click="router.push('/recipes')">
        <ChefHat :size="16" />
        <span>Відкрити AI Шефа</span>
      </button>
    </div>

    <!-- Recipe Grid -->
    <div v-else class="recipes-grid">
      <div
        v-for="recipe in filteredRecipes"
        :key="recipe.id"
        class="nordic-card recipe-card"
        @click="openRecipeModal(recipe)"
      >
        <div class="recipe-card-top">
          <div class="recipe-badge">
            <ChefHat :size="13" />
            <span>Рецепт</span>
          </div>
          <button
            class="delete-icon-btn"
            title="Видалити рецепт"
            @click.stop="handleDeleteRecipe(recipe.id)"
          >
            <Trash2 :size="13" />
          </button>
        </div>

        <h3 class="recipe-card-title">{{ recipe.name }}</h3>
        <p v-if="recipe.description" class="recipe-card-desc">{{ recipe.description }}</p>

        <div class="recipe-card-footer">
          <span class="ing-count">{{ recipe.ingredients?.length || 0 }} інгредієнтів</span>
          <span v-if="recipe.calories > 0" class="kcal-badge">
            <Flame :size="12" /> {{ recipe.calories }} кКал
          </span>
        </div>
      </div>
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

            <!-- Nutrition strip -->
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
                class="btn-primary btn-sm flex-1"
                :disabled="cookingId === selectedRecipe.id"
                @click="handleCookSavedRecipe(selectedRecipe)"
              >
                <Utensils :size="14" />
                <span>{{ cookingId === selectedRecipe.id ? 'Готуємо...' : 'Приготувати страву' }}</span>
              </button>
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
.saved-recipes-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.section-heading {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.section-subheading {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.btn-sm {
  padding: 7px 12px;
  font-size: 0.82rem;
}

.search-bar-row {
  width: 100%;
}

.search-input-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.search-icon {
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 0.84rem;
  color: var(--text-primary);
}

.loading-state, .empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spin-icon {
  color: var(--text-primary);
  margin-bottom: 10px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.empty-icon-box {
  width: 46px;
  height: 46px;
  margin-bottom: 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.recipe-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.recipe-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.recipe-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recipe-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.delete-icon-btn {
  color: var(--text-muted);
  padding: 3px;
  border-radius: 3px;
  transition: var(--transition-fast);
}

.delete-icon-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
}

.recipe-card-title {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 2px 0 0 0;
}

.recipe-card-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.recipe-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.74rem;
  color: var(--text-muted);
}

.kcal-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--status-warning);
  font-weight: 600;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 640px;
  margin: auto;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
}

.modal-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-recipe-title {
  font-size: 1.2rem;
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
