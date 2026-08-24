<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useNutritionStore, type NutritionLog } from '@/stores/nutrition';
import { useProductStore } from '@/stores/product';
import { useFridgeStore } from '@/stores/fridge';
import { 
  Flame, 
  Plus, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Coffee, 
  Soup, 
  Salad, 
  Cookie, 
  Trash2, 
  Edit2, 
  Refrigerator, 
  X, 
  Loader2 
} from '@lucide/vue';

const nutritionStore = useNutritionStore();
const productStore = useProductStore();
const fridgeStore = useFridgeStore();

const selectedDate = ref(new Date().toISOString().split('T')[0]);

const isLogModalOpen = ref(false);
const isTargetsModalOpen = ref(false);
const editingLog = ref<NutritionLog | null>(null);
const submitting = ref(false);

const selectedProductId = ref<number | null>(null);
const foodName = ref('');
const mealType = ref('breakfast');
const quantity = ref('100');
const unit = ref('g');
const calories = ref('0');
const protein = ref('0');
const fat = ref('0');
const carbs = ref('0');

const targetCalories = ref('2000');
const targetProtein = ref('120');
const targetFat = ref('65');
const targetCarbs = ref('200');

onMounted(async () => {
  await fridgeStore.fetchFridges();
  await nutritionStore.fetchDailyData(selectedDate.value);
  await productStore.fetchProducts();
});

watch(selectedDate, async (newDate) => {
  await nutritionStore.fetchDailyData(newDate);
});

watch(() => fridgeStore.activeFridgeId, async () => {
  nutritionStore.invalidateCache();
  await Promise.all([
    nutritionStore.fetchDailyData(selectedDate.value, true),
    productStore.fetchProducts(true)
  ]);
});

const isToday = computed(() => selectedDate.value === new Date().toISOString().split('T')[0]);

const handlePrevDay = () => {
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() - 1);
  selectedDate.value = d.toISOString().split('T')[0];
};

const handleNextDay = () => {
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() + 1);
  selectedDate.value = d.toISOString().split('T')[0];
};

const summary = computed(() => nutritionStore.currentData?.summary ?? { calories: 0, protein: 0, fat: 0, carbs: 0 });
const targets = computed(() => nutritionStore.currentData?.targets ?? { calories: null, protein: null, fat: null, carbs: null });

const calPercent = computed(() => {
  if (!targets.value.calories) return 0;
  return Math.min(100, Math.round((summary.value.calories / targets.value.calories) * 100));
});

const protPercent = computed(() => {
  if (!targets.value.protein) return 0;
  return Math.min(100, Math.round((summary.value.protein / Number(targets.value.protein)) * 100));
});

const fatPercent = computed(() => {
  if (!targets.value.fat) return 0;
  return Math.min(100, Math.round((summary.value.fat / Number(targets.value.fat)) * 100));
});

const carbsPercent = computed(() => {
  if (!targets.value.carbs) return 0;
  return Math.min(100, Math.round((summary.value.carbs / Number(targets.value.carbs)) * 100));
});

const mealsOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
const groupedLogs = computed(() => {
  const logs = nutritionStore.currentData?.logs ?? [];
  return mealsOrder.map((mType) => ({
    type: mType,
    items: logs.filter((l) => l.mealType === mType)
  }));
});

const getMealLabel = (type: string) => {
  switch (type) {
    case 'breakfast': return 'Сніданок';
    case 'lunch': return 'Обід';
    case 'dinner': return 'Вечеря';
    case 'snack': return 'Перекус';
    default: return type;
  }
};

const openAddModal = () => {
  editingLog.value = null;
  selectedProductId.value = null;
  foodName.value = '';
  mealType.value = 'breakfast';
  quantity.value = '100';
  unit.value = 'g';
  calories.value = '0';
  protein.value = '0';
  fat.value = '0';
  carbs.value = '0';
  isLogModalOpen.value = true;
};

const openEditModal = (log: NutritionLog) => {
  editingLog.value = log;
  selectedProductId.value = null;
  foodName.value = log.foodName;
  mealType.value = log.mealType;
  quantity.value = log.quantity?.toString() ?? '1';
  unit.value = log.unit ?? 'порція';
  calories.value = log.calories.toString();
  protein.value = log.protein.toString();
  fat.value = log.fat.toString();
  carbs.value = log.carbs.toString();
  isLogModalOpen.value = true;
};

const openTargetsModal = () => {
  targetCalories.value = targets.value.calories?.toString() ?? '2000';
  targetProtein.value = targets.value.protein?.toString() ?? '120';
  targetFat.value = targets.value.fat?.toString() ?? '65';
  targetCarbs.value = targets.value.carbs?.toString() ?? '200';
  isTargetsModalOpen.value = true;
};

const handleSelectFridgeProduct = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const val = target.value;
  if (!val || val === 'none') {
    selectedProductId.value = null;
    return;
  }
  const pid = Number(val);
  selectedProductId.value = pid;
  const prod = productStore.products.find((p) => p.id === pid);
  if (prod) {
    foodName.value = prod.name;
    unit.value = prod.unit || 'г';
    quantity.value = prod.quantity?.toString() ?? '100';
  }
};

const handleSubmitLog = async () => {
  if (!foodName.value.trim()) return;
  submitting.value = true;
  try {
    const payload = {
      date: selectedDate.value,
      mealType: mealType.value,
      foodName: foodName.value.trim(),
      quantity: quantity.value ? Number(quantity.value) : null,
      unit: unit.value.trim() || null,
      calories: Number(calories.value) || 0,
      protein: Number(protein.value) || 0,
      fat: Number(fat.value) || 0,
      carbs: Number(carbs.value) || 0,
      productId: selectedProductId.value
    };

    if (editingLog.value) {
      await nutritionStore.updateLog(editingLog.value.id, selectedDate.value, {
        mealType: payload.mealType,
        foodName: payload.foodName,
        quantity: payload.quantity,
        unit: payload.unit,
        calories: payload.calories,
        protein: payload.protein,
        fat: payload.fat,
        carbs: payload.carbs
      });
    } else {
      await nutritionStore.logFood(payload);
      if (selectedProductId.value) {
        await productStore.fetchProducts();
      }
    }
    isLogModalOpen.value = false;
  } finally {
    submitting.value = false;
  }
};

const handleDeleteLog = async (id: number) => {
  if (!confirm('Вилучити цей запис прийому їжі?')) return;
  await nutritionStore.deleteLog(id, selectedDate.value);
};

const handleSubmitTargets = async () => {
  submitting.value = true;
  try {
    await nutritionStore.setTargets({
      calories: targetCalories.value ? Number(targetCalories.value) : null,
      protein: targetProtein.value ? Number(targetProtein.value) : null,
      fat: targetFat.value ? Number(targetFat.value) : null,
      carbs: targetCarbs.value ? Number(targetCarbs.value) : null
    }, selectedDate.value);
    isTargetsModalOpen.value = false;
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="nutrition-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-titles">
        <h2 class="section-heading">Трекер калорій</h2>
        <p class="section-subheading">Щоденник харчування та контроль БЖУ</p>
      </div>

      <div class="header-actions">
        <button class="btn-secondary btn-sm" title="Налаштувати цілі" @click="openTargetsModal">
          <Settings :size="15" />
          <span>Цілі</span>
        </button>
        <button class="btn-primary btn-sm" @click="openAddModal">
          <Plus :size="16" />
          <span>Додати їжу</span>
        </button>
      </div>
    </header>

    <!-- Date Navigation Bar -->
    <div class="date-bar">
      <button class="date-nav-btn" @click="handlePrevDay">
        <ChevronLeft :size="18" />
      </button>
      <div class="date-display">
        <Calendar :size="16" class="date-icon" />
        <span>{{ isToday ? 'Сьогодні (' + selectedDate + ')' : selectedDate }}</span>
      </div>
      <button class="date-nav-btn" @click="handleNextDay">
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Main Dashboard Grid -->
    <div v-if="nutritionStore.loading && !nutritionStore.currentData" class="loading-state">
      <Loader2 :size="32" class="animate-spin" />
    </div>

    <div v-else class="dashboard-grid">
      <!-- Calories Main Ring Card -->
      <div class="calories-card card">
        <div class="calories-info">
          <div class="card-tag">
            <Flame :size="16" class="orange-icon" />
            <span>Калорії</span>
          </div>
          <div class="calories-num">
            {{ summary.calories }}
            <span class="unit-text">кКал</span>
          </div>
          <p class="goal-text">
            <template v-if="targets.calories">Ціль: {{ targets.calories }} кКал</template>
            <template v-else>Ціль не встановлено</template>
          </p>
        </div>

        <div class="ring-wrapper">
          <svg class="progress-ring" viewBox="0 0 36 36">
            <path
              class="ring-bg"
              stroke-width="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="ring-progress"
              stroke-width="3.5"
              :stroke-dasharray="`${calPercent}, 100`"
              stroke-linecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="ring-label">{{ calPercent }}%</div>
        </div>
      </div>

      <!-- Macros Mini Grid -->
      <div class="macros-grid">
        <!-- Protein -->
        <div class="macro-card card protein-card">
          <div class="macro-title">Білки</div>
          <div class="macro-val">
            {{ Math.round(summary.protein) }}<span class="macro-unit">г</span>
          </div>
          <div class="macro-goal">Ціль: {{ targets.protein ?? '—' }}г</div>
          <div class="macro-bar-bg">
            <div class="macro-bar-fill protein-fill" :style="{ width: `${protPercent}%` }" />
          </div>
        </div>

        <!-- Fat -->
        <div class="macro-card card fat-card">
          <div class="macro-title">Жири</div>
          <div class="macro-val">
            {{ Math.round(summary.fat) }}<span class="macro-unit">г</span>
          </div>
          <div class="macro-goal">Ціль: {{ targets.fat ?? '—' }}г</div>
          <div class="macro-bar-bg">
            <div class="macro-bar-fill fat-fill" :style="{ width: `${fatPercent}%` }" />
          </div>
        </div>

        <!-- Carbs -->
        <div class="macro-card card carbs-card">
          <div class="macro-title">Вуглеводи</div>
          <div class="macro-val">
            {{ Math.round(summary.carbs) }}<span class="macro-unit">г</span>
          </div>
          <div class="macro-goal">Ціль: {{ targets.carbs ?? '—' }}г</div>
          <div class="macro-bar-bg">
            <div class="macro-bar-fill carbs-fill" :style="{ width: `${carbsPercent}%` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Food Diary Groups -->
    <section class="diary-section">
      <h2 class="section-title">Прийоми їжі</h2>

      <div class="meals-list">
        <div v-for="group in groupedLogs" :key="group.type" class="meal-group">
          <div class="meal-header">
            <div class="meal-title">
              <Coffee v-if="group.type === 'breakfast'" :size="18" class="meal-icon" />
              <Soup v-else-if="group.type === 'lunch'" :size="18" class="meal-icon" />
              <Salad v-else-if="group.type === 'dinner'" :size="18" class="meal-icon" />
              <Cookie v-else :size="18" class="meal-icon" />
              <span>{{ getMealLabel(group.type) }}</span>
            </div>
            <span v-if="group.items.length > 0" class="meal-calories">
              {{ group.items.reduce((acc, i) => acc + i.calories, 0) }} кКал
            </span>
          </div>

          <div v-if="group.items.length === 0" class="empty-meal-hint">
            Записів немає
          </div>

          <div v-else class="logs-card card">
            <div v-for="log in group.items" :key="log.id" class="log-item">
              <div class="log-info">
                <div class="log-name">{{ log.foodName }}</div>
                <div class="log-details">
                  {{ log.quantity }} {{ log.unit ?? 'порція' }} · Б: {{ Math.round(log.protein) }}г · Ж: {{ Math.round(log.fat) }}г · В: {{ Math.round(log.carbs) }}г
                </div>
              </div>

              <div class="log-right">
                <span class="log-kcal">{{ log.calories }} кКал</span>
                <div class="log-actions">
                  <button class="action-btn" title="Редагувати" @click="openEditModal(log)">
                    <Edit2 :size="16" />
                  </button>
                  <button class="action-btn danger" title="Вилучити" @click="handleDeleteLog(log.id)">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal: Log Food -->
    <transition name="fade">
      <div v-if="isLogModalOpen" class="modal-overlay" @click.self="isLogModalOpen = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingLog ? 'Редагувати прийом їжі' : 'Додати прийом їжі' }}</h3>
            <button class="close-modal-btn" @click="isLogModalOpen = false">
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="handleSubmitLog" class="modal-form">
            <!-- Select from active fridge option (only on Add) -->
            <div v-if="!editingLog && productStore.products.length > 0" class="form-group">
              <label class="form-label font-icon-label">
                <Refrigerator :size="16" class="orange-icon" />
                Вибрати з холодильника
              </label>
              <select class="form-input" @change="handleSelectFridgeProduct">
                <option value="none">-- Ручне введення --</option>
                <option v-for="prod in productStore.products" :key="prod.id" :value="prod.id">
                  {{ prod.name }} ({{ prod.quantity }} {{ prod.unit }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Назва страви / продукту</label>
              <input v-model="foodName" type="text" class="form-input" placeholder="Наприклад: Овсянка з яблуком" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Прийом їжі</label>
                <select v-model="mealType" class="form-input">
                  <option value="breakfast">Сніданок</option>
                  <option value="lunch">Обід</option>
                  <option value="dinner">Вечеря</option>
                  <option value="snack">Перекус</option>
                </select>
              </div>

              <div class="form-row-inner">
                <div class="form-group">
                  <label class="form-label">Кількість</label>
                  <input v-model="quantity" type="number" step="0.1" min="0" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Од.</label>
                  <input v-model="unit" type="text" class="form-input" />
                </div>
              </div>
            </div>

            <div v-if="selectedProductId" class="fridge-warning">
              ⚠️ При збереженні кількість продукту в холодильнику буде автоматично зменшена на {{ quantity }} {{ unit }}.
            </div>

            <div class="macros-inputs-block">
              <div class="block-title">Поживна цінність</div>
              <div class="macros-inputs-grid">
                <div class="form-group">
                  <label class="form-label">Ккал</label>
                  <input v-model="calories" type="number" min="0" class="form-input text-center" />
                </div>
                <div class="form-group">
                  <label class="form-label protein-text">Білки (г)</label>
                  <input v-model="protein" type="number" step="0.1" min="0" class="form-input text-center" />
                </div>
                <div class="form-group">
                  <label class="form-label fat-text">Жири (г)</label>
                  <input v-model="fat" type="number" step="0.1" min="0" class="form-input text-center" />
                </div>
                <div class="form-group">
                  <label class="form-label carbs-text">Вуглеводи (г)</label>
                  <input v-model="carbs" type="number" step="0.1" min="0" class="form-input text-center" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="isLogModalOpen = false">Скасувати</button>
              <button type="submit" class="btn-primary" :disabled="submitting">
                <Loader2 v-if="submitting" :size="16" class="animate-spin" />
                <span>Зберегти</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Modal: Nutrition Goals/Targets -->
    <transition name="fade">
      <div v-if="isTargetsModalOpen" class="modal-overlay" @click.self="isTargetsModalOpen = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Денні цілі КБЖВ</h3>
            <button class="close-modal-btn" @click="isTargetsModalOpen = false">
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="handleSubmitTargets" class="modal-form">
            <div class="form-group">
              <label class="form-label font-bold">Денна ціль калорій (кКал)</label>
              <input v-model="targetCalories" type="number" min="0" class="form-input font-bold" required />
            </div>

            <div class="macros-inputs-grid">
              <div class="form-group">
                <label class="form-label protein-text">Білки (г)</label>
                <input v-model="targetProtein" type="number" min="0" class="form-input text-center" />
              </div>
              <div class="form-group">
                <label class="form-label fat-text">Жири (г)</label>
                <input v-model="targetFat" type="number" min="0" class="form-input text-center" />
              </div>
              <div class="form-group">
                <label class="form-label carbs-text">Вуглеводи (г)</label>
                <input v-model="targetCarbs" type="number" min="0" class="form-input text-center" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="isTargetsModalOpen = false">Скасувати</button>
              <button type="submit" class="btn-primary" :disabled="submitting">
                <Loader2 v-if="submitting" :size="16" class="animate-spin" />
                <span>Зберегти цілі</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.nutrition-page {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-sm {
  padding: 7px 12px;
  font-size: 0.82rem;
}

.date-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 320px;
  margin: 0 auto;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  width: 100%;
}

.date-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.date-nav-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.date-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--text-primary);
}

.date-icon {
  color: var(--primary);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
  color: var(--primary);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-card);
}

.calories-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}

.calories-num {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
  margin-top: 4px;
}

.unit-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-left: 4px;
}

.goal-text {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.ring-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  color: var(--border-subtle);
}

.ring-progress {
  color: var(--primary);
  transition: stroke-dasharray 0.4s ease;
}

.ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.macros-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.macro-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
}

.macro-title {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.protein-card .macro-title { color: #10B981; }
.fat-card .macro-title { color: #F59E0B; }
.carbs-card .macro-title { color: #0284C7; }

.macro-val {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 4px 0 2px 0;
}

.macro-unit {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-left: 2px;
}

.macro-goal {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.macro-bar-bg {
  width: 100%;
  height: 4px;
  border-radius: 4px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.macro-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.protein-fill { background: #10B981; }
.fat-fill { background: #F59E0B; }
.carbs-fill { background: #0284C7; }

.diary-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.meals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meal-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-subtle);
}

.meal-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.86rem;
  color: var(--text-primary);
}

.meal-icon {
  color: var(--text-secondary);
}

.meal-calories {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.empty-meal-hint {
  font-size: 0.76rem;
  color: var(--text-muted);
  font-style: italic;
  padding: 6px 10px;
}

.logs-card {
  padding: 0;
  overflow: hidden;
}

.log-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.log-item:last-child {
  border-bottom: none;
}

.log-name {
  font-weight: 500;
  font-size: 0.86rem;
  color: var(--text-primary);
}

.log-details {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 1px;
}

.log-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-kcal {
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--text-primary);
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.action-btn {
  padding: 5px;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.action-btn.danger:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
}

/* Modals */
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

.modal-content {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 520px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
  margin: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.modal-header h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-modal-btn {
  color: var(--text-muted);
  padding: 5px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
}

.close-modal-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.font-icon-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.protein-text { color: #10B981; }
.fat-text { color: #F59E0B; }
.carbs-text { color: #0284C7; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.form-row-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

@media (max-width: 440px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.fridge-warning {
  font-size: 0.76rem;
  color: var(--status-warning);
  background: var(--status-warning-bg);
  padding: 8px 10px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--status-warning-border);
}

.macros-inputs-block {
  border-top: 1px solid var(--border-subtle);
  padding-top: 10px;
}

.block-title {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.macros-inputs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

@media (max-width: 420px) {
  .macros-inputs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.text-center {
  text-align: center;
}

.orange-icon {
  color: var(--primary);
}
</style>
