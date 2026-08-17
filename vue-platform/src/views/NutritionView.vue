<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useNutritionStore, type NutritionLog } from '@/stores/nutrition';
import { useProductStore } from '@/stores/product';
import { useI18n } from '@/i18n';
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
const { t } = useI18n();

const selectedDate = ref(new Date().toISOString().split('T')[0]);

const isLogModalOpen = ref(false);
const isTargetsModalOpen = ref(false);
const editingLog = ref<NutritionLog | null>(null);
const submitting = ref(false);

const selectedProductId = ref<number | null>(null);
const foodName = ref('');
const mealType = ref('breakfast');
const quantity = ref('100');
const unit = ref('г');
const calories = ref('0');
const protein = ref('0');
const fat = ref('0');
const carbs = ref('0');

const targetCalories = ref('2000');
const targetProtein = ref('120');
const targetFat = ref('65');
const targetCarbs = ref('200');

onMounted(async () => {
  await nutritionStore.fetchDailyData(selectedDate.value);
  await productStore.fetchProducts();
});

watch(selectedDate, async (newDate) => {
  await nutritionStore.fetchDailyData(newDate);
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
const localizedMealLabels: Record<string, string> = {
  breakfast: 'Сніданок',
  lunch: 'Обід',
  dinner: 'Вечеря',
  snack: 'Перекус'
};

const groupedLogs = computed(() => {
  const logs = nutritionStore.currentData?.logs ?? [];
  return mealsOrder.map((mType) => ({
    type: mType,
    label: localizedMealLabels[mType] || mType,
    items: logs.filter((l) => l.mealType === mType)
  }));
});

const getMealIcon = (type: string) => {
  switch (type) {
    case 'breakfast': return Coffee;
    case 'lunch': return Soup;
    case 'dinner': return Salad;
    default: return Cookie;
  }
};

const openAddModal = (mType = 'breakfast') => {
  editingLog.value = null;
  selectedProductId.value = null;
  foodName.value = '';
  mealType.value = mType;
  quantity.value = '100';
  unit.value = 'г';
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
  quantity.value = log.quantity?.toString() ?? '100';
  unit.value = log.unit ?? 'г';
  calories.value = log.calories?.toString() ?? '0';
  protein.value = log.protein?.toString() ?? '0';
  fat.value = log.fat?.toString() ?? '0';
  carbs.value = log.carbs?.toString() ?? '0';
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
  if (!confirm(t('deleteConfirm') || 'Вилучити цей запис?')) return;
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
  <div class="nutrition-page fade-in">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h2 class="section-heading">{{ t('navNutrition') }}</h2>
        <p class="section-subheading">{{ t('dashboardQuickNutritionDesc') }}</p>
      </div>

      <div class="header-actions">
        <button class="btn-secondary btn-sm" :title="t('targetsModalTitle') || 'Цілі КБЖВ'" @click="openTargetsModal">
          <Settings :size="15" />
          <span>{{ t('targetsModalTitle') || 'Цілі КБЖВ' }}</span>
        </button>
        <button class="btn-primary btn-sm" @click="openAddModal()">
          <Plus :size="16" />
          <span>{{ t('nutritionAddMeal') || 'Додати прийом їжі' }}</span>
        </button>
      </div>
    </header>

    <!-- Date Navigation -->
    <div class="date-bar nordic-card">
      <button class="date-nav-btn" @click="handlePrevDay">
        <ChevronLeft :size="16" />
      </button>
      <div class="date-display">
        <Calendar :size="14" class="date-icon" />
        <span>{{ isToday ? ('Сьогодні, ' + selectedDate) : selectedDate }}</span>
      </div>
      <button class="date-nav-btn" @click="handleNextDay">
        <ChevronRight :size="16" />
      </button>
    </div>

    <!-- Summary Overview -->
    <div class="summary-grid">
      <!-- Main Calories Card -->
      <div class="nordic-card cal-main-card">
        <div class="cal-header">
          <div class="card-tag">
            <Flame :size="15" />
            <span>Калорії</span>
          </div>
          <span class="goal-sub">Ціль: {{ targets.calories || 2000 }} кКал</span>
        </div>

        <div class="cal-number-row">
          <span class="cal-value">{{ summary.calories }}</span>
          <span class="cal-unit">кКал</span>
        </div>

        <!-- Progress Bar -->
        <div class="progress-track">
          <div class="progress-fill fill-cal" :style="{ width: `${calPercent}%` }" />
        </div>
        <span class="pct-text">{{ calPercent }}% від денної норми</span>
      </div>

      <!-- Macros Summary Card -->
      <div class="nordic-card macros-summary-card">
        <div class="macro-stat-row">
          <div class="stat-info">
            <span class="macro-name prot">Білки</span>
            <span class="macro-vals"><strong>{{ Math.round(summary.protein) }}г</strong> / {{ targets.protein || 120 }}г</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill fill-prot" :style="{ width: `${protPercent}%` }" />
          </div>
        </div>

        <div class="macro-stat-row">
          <div class="stat-info">
            <span class="macro-name fat">Жири</span>
            <span class="macro-vals"><strong>{{ Math.round(summary.fat) }}г</strong> / {{ targets.fat || 65 }}г</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill fill-fat" :style="{ width: `${fatPercent}%` }" />
          </div>
        </div>

        <div class="macro-stat-row">
          <div class="stat-info">
            <span class="macro-name carbs">Вуглеводи</span>
            <span class="macro-vals"><strong>{{ Math.round(summary.carbs) }}г</strong> / {{ targets.carbs || 200 }}г</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill fill-carbs" :style="{ width: `${carbsPercent}%` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Meal Groups List -->
    <div class="meal-groups-container">
      <div v-for="group in groupedLogs" :key="group.type" class="nordic-card meal-group-card">
        <div class="group-header">
          <div class="group-title-row">
            <component :is="getMealIcon(group.type)" :size="16" class="group-icon" />
            <h3>{{ group.label }}</h3>
            <span class="group-count">({{ group.items.length }})</span>
          </div>
          <button class="add-meal-icon-btn" title="Додати в цей прийом" @click="openAddModal(group.type)">
            <Plus :size="14" />
            <span>Додати</span>
          </button>
        </div>

        <div v-if="group.items.length === 0" class="empty-group">
          <span>Немає записів для цього прийому їжі.</span>
        </div>

        <div v-else class="logs-list">
          <div v-for="log in group.items" :key="log.id" class="log-item-row">
            <div class="log-info">
              <span class="log-name">{{ log.foodName }}</span>
              <span v-if="log.quantity" class="log-qty">{{ log.quantity }} {{ log.unit || '' }}</span>
            </div>

            <div class="log-macros">
              <span class="log-kcal">{{ log.calories }} кКал</span>
              <span class="macro-mini">Б: {{ Math.round(log.protein) }}г</span>
              <span class="macro-mini">Ж: {{ Math.round(log.fat) }}г</span>
              <span class="macro-mini">В: {{ Math.round(log.carbs) }}г</span>
            </div>

            <div class="log-actions">
              <button class="icon-btn" title="Редагувати" @click="openEditModal(log)">
                <Edit2 :size="13" />
              </button>
              <button class="icon-btn danger" title="Видалити" @click="handleDeleteLog(log.id)">
                <Trash2 :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Add / Edit Food Log -->
    <transition name="fade">
      <div v-if="isLogModalOpen" class="modal-overlay" @click.self="isLogModalOpen = false">
        <div class="modal-card nordic-card">
          <div class="modal-header">
            <h3>{{ editingLog ? 'Редагувати запис' : 'Додати їжу в щоденник' }}</h3>
            <button class="close-btn" @click="isLogModalOpen = false">
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="handleSubmitLog" class="modal-body">
            <!-- Auto fill from fridge -->
            <div v-if="!editingLog && productStore.products.length > 0" class="form-group">
              <label class="form-label flex-label">
                <Refrigerator :size="14" />
                <span>Вибрати з наявних у холодильнику</span>
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
              <input v-model="foodName" type="text" class="form-input" placeholder="Наприклад: Вівсянка з ягодами" required />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Прийом їжі</label>
                <select v-model="mealType" class="form-input">
                  <option value="breakfast">Сніданок</option>
                  <option value="lunch">Обід</option>
                  <option value="dinner">Вечеря</option>
                  <option value="snack">Перекус</option>
                </select>
              </div>

              <div class="form-group flex-1">
                <label class="form-label">Кількість та од.</label>
                <div class="qty-unit-row">
                  <input v-model="quantity" type="number" step="0.1" min="0" class="form-input" />
                  <input v-model="unit" type="text" class="form-input unit-input" />
                </div>
              </div>
            </div>

            <div class="macros-grid">
              <div class="form-group">
                <label class="form-label">Ккал</label>
                <input v-model="calories" type="number" min="0" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Білки (г)</label>
                <input v-model="protein" type="number" step="0.1" min="0" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Жири (г)</label>
                <input v-model="fat" type="number" step="0.1" min="0" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Вуглеводи (г)</label>
                <input v-model="carbs" type="number" step="0.1" min="0" class="form-input" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary btn-sm" @click="isLogModalOpen = false">Скасувати</button>
              <button type="submit" class="btn-primary btn-sm" :disabled="submitting">
                <Loader2 v-if="submitting" :size="14" class="spin-icon" />
                <span>{{ editingLog ? 'Оновити' : 'Додати' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Modal: Goals / Targets -->
    <transition name="fade">
      <div v-if="isTargetsModalOpen" class="modal-overlay" @click.self="isTargetsModalOpen = false">
        <div class="modal-card nordic-card">
          <div class="modal-header">
            <h3>Денні цілі калорій та БЖУ</h3>
            <button class="close-btn" @click="isTargetsModalOpen = false">
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="handleSubmitTargets" class="modal-body">
            <div class="form-group">
              <label class="form-label">Ціль калорій (кКал / день)</label>
              <input v-model="targetCalories" type="number" min="0" class="form-input" required />
            </div>

            <div class="macros-grid">
              <div class="form-group">
                <label class="form-label">Білки (г)</label>
                <input v-model="targetProtein" type="number" min="0" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Жири (г)</label>
                <input v-model="targetFat" type="number" min="0" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Вуглеводи (г)</label>
                <input v-model="targetCarbs" type="number" min="0" class="form-input" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary btn-sm" @click="isTargetsModalOpen = false">Скасувати</button>
              <button type="submit" class="btn-primary btn-sm" :disabled="submitting">
                <Loader2 v-if="submitting" :size="14" class="spin-icon" />
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
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-nav-btn {
  padding: 4px;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  transition: var(--transition-fast);
}

.date-nav-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.date-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 680px) {
  .summary-grid {
    grid-template-columns: 1fr 1.3fr;
  }
}

.cal-main-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.goal-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.cal-number-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.cal-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.cal-unit {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.progress-track {
  width: 100%;
  height: 6px;
  background: var(--bg-subtle);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.fill-cal { background: var(--primary); }
.fill-prot { background: var(--status-fresh); }
.fill-fat { background: var(--status-warning); }
.fill-carbs { background: var(--text-muted); }

.pct-text {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.macros-summary-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 12px;
}

.macro-stat-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
}

.macro-name {
  font-weight: 600;
}

.macro-name.prot { color: var(--status-fresh); }
.macro-name.fat { color: var(--status-warning); }
.macro-name.carbs { color: var(--text-secondary); }

.meal-groups-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meal-group-card {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.group-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-title-row h3 {
  font-size: 0.92rem;
  font-weight: 600;
}

.group-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.add-meal-icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  font-size: 0.74rem;
  transition: var(--transition-fast);
}

.add-meal-icon-btn:hover {
  background: var(--primary);
  color: var(--primary-foreground);
}

.empty-group {
  font-size: 0.78rem;
  color: var(--text-muted);
  padding: 6px 0;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  background: var(--bg-subtle);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  font-size: 0.82rem;
  gap: 10px;
}

.log-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.log-name {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-qty {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.log-macros {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.74rem;
}

.log-kcal {
  font-weight: 600;
  color: var(--text-primary);
}

.macro-mini {
  color: var(--text-muted);
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  color: var(--text-muted);
  padding: 3px;
  border-radius: 3px;
  transition: var(--transition-fast);
}

.icon-btn:hover {
  color: var(--text-primary);
  background: var(--bg-surface);
}

.icon-btn.danger:hover {
  color: var(--status-expired);
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
  max-width: 460px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-header h3 {
  font-size: 0.95rem;
  font-weight: 600;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flex-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 10px;
}

.qty-unit-row {
  display: flex;
  gap: 6px;
}

.unit-input {
  width: 60px;
}

.macros-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}
</style>
