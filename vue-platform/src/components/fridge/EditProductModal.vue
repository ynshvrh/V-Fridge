<script setup lang="ts">
import { ref, computed } from 'vue';
import { type Product, useProductStore } from '@/stores/product';
import { useNutritionStore } from '@/stores/nutrition';
import { useCurrentLanguage } from '@/composables/useCurrentLanguage';
import { getUnitOptions } from '@/utils/unitStandards';
import {
  Edit3,
  X,
  Trash2,
  Calendar,
  Plus,
  Minus,
  Flame,
  Sparkles,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp
} from '@lucide/vue';

const props = defineProps<{
  product: Product;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
  (e: 'deleted'): void;
}>();

const productStore = useProductStore();
const nutritionStore = useNutritionStore();
const { currentLanguage } = useCurrentLanguage();

const name = ref(props.product.name);
const description = ref(props.product.description || '');
const quantity = ref(props.product.quantity);
const unit = ref(props.product.unit || 'pcs');
const expiryDate = ref(props.product.expiryDate || '');
const category = ref(props.product.category || 'other');

const calories = ref<number | undefined>(props.product.calories ?? undefined);
const protein = ref<number | undefined>(props.product.protein ?? undefined);
const fat = ref<number | undefined>(props.product.fat ?? undefined);
const carbs = ref<number | undefined>(props.product.carbs ?? undefined);

const showNutrition = ref(calories.value !== undefined || protein.value !== undefined);
const isSaving = ref(false);
const isDeleting = ref(false);
const isEstimating = ref(false);
const estimateNotice = ref<string | null>(null);

const categories = [
  { id: 'dairy', label: 'Молочне' },
  { id: 'meat-fish', label: 'М\'ясо та риба' },
  { id: 'vegetables', label: 'Овочі та зелень' },
  { id: 'fruits', label: 'Фрукти та ягоди' },
  { id: 'bakery', label: 'Випічка' },
  { id: 'pantry', label: 'Бакалія' },
  { id: 'sauces', label: 'Соуси та спеції' },
  { id: 'drinks', label: 'Напої' },
  { id: 'frozen', label: 'Заморозка' },
  { id: 'canned-prepared', label: 'Консерви' },
  { id: 'prepared-meals', label: 'Готові страви' },
  { id: 'snacks', label: 'Снеки' },
  { id: 'alcohol', label: 'Алкоголь' },
  { id: 'other', label: 'Інше' }
];

const unitOptions = computed(() => getUnitOptions(currentLanguage.value, true));

const setExpiryDays = (days: number) => {
  const target = new Date();
  target.setDate(target.getDate() + days);
  expiryDate.value = target.toISOString().split('T')[0];
};

const clearExpiry = () => {
  expiryDate.value = '';
};

const adjustQuantity = (delta: number) => {
  const current = quantity.value;
  const step = current < 1 ? 0.1 : 1;
  const next = Math.max(0.01, parseFloat((current + delta * step).toFixed(2)));
  quantity.value = next;
};

const handleEstimateNutrition = async () => {
  if (!name.value) return;
  isEstimating.value = true;
  estimateNotice.value = null;
  try {
    const res = await nutritionStore.estimateNutrition({
      dishName: name.value,
      quantity: quantity.value,
      unit: unit.value
    });
    if (res) {
      calories.value = res.calories;
      protein.value = res.protein;
      fat.value = res.fat;
      carbs.value = res.carbs;
      showNutrition.value = true;
      estimateNotice.value = 'КБЖВ розраховано за алгоритмом/ШІ';
      setTimeout(() => {
        estimateNotice.value = null;
      }, 3000);
    }
  } catch {
    estimateNotice.value = 'Не вдалося оцінити КБЖВ';
  } finally {
    isEstimating.value = false;
  }
};

const handleSave = async () => {
  if (!name.value.trim() || quantity.value <= 0) return;
  isSaving.value = true;
  try {
    const success = await productStore.updateProduct(props.product.id, {
      name: name.value.trim(),
      description: description.value.trim() || undefined,
      quantity: quantity.value,
      unit: unit.value,
      expiryDate: expiryDate.value || null,
      category: category.value,
      calories: calories.value !== undefined && !isNaN(calories.value) ? calories.value : null,
      protein: protein.value !== undefined && !isNaN(protein.value) ? protein.value : null,
      fat: fat.value !== undefined && !isNaN(fat.value) ? fat.value : null,
      carbs: carbs.value !== undefined && !isNaN(carbs.value) ? carbs.value : null
    });
    if (success) {
      emit('updated');
      emit('close');
    }
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async () => {
  if (!confirm(`Видалити «${props.product.name}» з холодильника?`)) return;
  isDeleting.value = true;
  try {
    const success = await productStore.deleteProduct(props.product.id);
    if (success) {
      emit('deleted');
      emit('close');
    }
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-sheet glass-card fade-in">
        <!-- Header -->
        <div class="sheet-header">
          <div class="header-title">
            <div class="icon-avatar">
              <Edit3 :size="18" />
            </div>
            <div>
              <h3>Редагувати продукт</h3>
              <p class="subtitle">Змініть параметри чи термін придатності</p>
            </div>
          </div>
          <button class="close-btn" aria-label="Закрити" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="sheet-body">
          <!-- Product Name -->
          <div class="field-group">
            <label class="field-label" for="edit-prod-name">Назва продукту</label>
            <input
              id="edit-prod-name"
              v-model="name"
              type="text"
              class="input-field"
              placeholder="Наприклад: Сир домашній"
              required
            />
          </div>

          <!-- Quantity & Unit -->
          <div class="field-row">
            <div class="field-group flex-1">
              <label class="field-label">Кількість</label>
              <div class="stepper-input">
                <button
                  type="button"
                  class="stepper-btn"
                  @click="adjustQuantity(-1)"
                >
                  <Minus :size="14" />
                </button>
                <input
                  v-model.number="quantity"
                  type="number"
                  step="any"
                  min="0.01"
                  class="stepper-field"
                />
                <button
                  type="button"
                  class="stepper-btn"
                  @click="adjustQuantity(1)"
                >
                  <Plus :size="14" />
                </button>
              </div>
            </div>

            <div class="field-group flex-1">
              <label class="field-label">Одиниця</label>
              <select v-model="unit" class="select-field">
                <option
                  v-for="opt in unitOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Category Selector -->
          <div class="field-group">
            <label class="field-label">Категорія</label>
            <div class="category-pills">
              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                class="cat-pill"
                :class="{ active: category === cat.id }"
                @click="category = cat.id"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>

          <!-- Expiry Date with quick buttons -->
          <div class="field-group">
            <div class="label-row">
              <label class="field-label">
                <Calendar :size="13" class="inline-icon" />
                Термін придатності
              </label>
              <button
                v-if="expiryDate"
                type="button"
                class="text-link-btn"
                @click="clearExpiry"
              >
                Очистити
              </button>
            </div>
            <input
              v-model="expiryDate"
              type="date"
              class="input-field"
            />
            <div class="quick-expiry-row">
              <span class="quick-title">Швидко:</span>
              <button type="button" class="quick-btn" @click="setExpiryDays(1)">+1 день</button>
              <button type="button" class="quick-btn" @click="setExpiryDays(3)">+3 дні</button>
              <button type="button" class="quick-btn" @click="setExpiryDays(7)">+1 тиждень</button>
              <button type="button" class="quick-btn" @click="setExpiryDays(14)">+2 тижні</button>
            </div>
          </div>

          <!-- Description / Notes -->
          <div class="field-group">
            <label class="field-label">Нотатки / опис</label>
            <input
              v-model="description"
              type="text"
              class="input-field"
              placeholder="Додаткова інформація..."
            />
          </div>

          <!-- Macros Collapsible -->
          <div class="nutrition-section">
            <button
              type="button"
              class="nutrition-toggle-btn"
              @click="showNutrition = !showNutrition"
            >
              <div class="toggle-left">
                <Flame :size="15" class="flame-icon" />
                <span>Харчова цінність (КБЖВ)</span>
              </div>
              <component :is="showNutrition ? ChevronUp : ChevronDown" :size="15" />
            </button>

            <div v-if="showNutrition" class="nutrition-fields fade-in">
              <div class="ai-estimate-bar">
                <button
                  type="button"
                  class="btn-ai-estimate"
                  :disabled="isEstimating || !name"
                  @click="handleEstimateNutrition"
                >
                  <Loader2 v-if="isEstimating" :size="13" class="spin" />
                  <Sparkles v-else :size="13" />
                  <span>{{ isEstimating ? 'Оцінюємо...' : 'Оцінити через ШІ' }}</span>
                </button>
                <span v-if="estimateNotice" class="estimate-notice">{{ estimateNotice }}</span>
              </div>

              <div class="macros-grid">
                <div class="macro-cell">
                  <span class="macro-label">Калорії</span>
                  <div class="macro-input-wrap">
                    <input
                      v-model.number="calories"
                      type="number"
                      placeholder="0"
                      class="macro-input"
                    />
                    <span class="macro-suffix">ккал</span>
                  </div>
                </div>

                <div class="macro-cell">
                  <span class="macro-label">Білки</span>
                  <div class="macro-input-wrap">
                    <input
                      v-model.number="protein"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      class="macro-input"
                    />
                    <span class="macro-suffix">г</span>
                  </div>
                </div>

                <div class="macro-cell">
                  <span class="macro-label">Жири</span>
                  <div class="macro-input-wrap">
                    <input
                      v-model.number="fat"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      class="macro-input"
                    />
                    <span class="macro-suffix">г</span>
                  </div>
                </div>

                <div class="macro-cell">
                  <span class="macro-label">Вуглеводи</span>
                  <div class="macro-input-wrap">
                    <input
                      v-model.number="carbs"
                      type="number"
                      step="0.1"
                      placeholder="0"
                      class="macro-input"
                    />
                    <span class="macro-suffix">г</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="sheet-footer">
          <button
            type="button"
            class="btn-delete"
            :disabled="isDeleting || isSaving"
            @click="handleDelete"
          >
            <Trash2 :size="15" />
            <span>{{ isDeleting ? 'Видалення...' : 'Видалити' }}</span>
          </button>

          <div class="footer-primary-actions">
            <button
              type="button"
              class="btn-ghost"
              @click="emit('close')"
            >
              Скасувати
            </button>
            <button
              type="button"
              class="btn-primary"
              :disabled="isSaving || isDeleting || !name"
              @click="handleSave"
            >
              <Loader2 v-if="isSaving" :size="15" class="spin" />
              <Check v-else :size="15" />
              <span>{{ isSaving ? 'Збереження...' : 'Зберегти зміни' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

@media (max-width: 640px) {
  .modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }
}

.modal-sheet {
  width: 100%;
  max-width: 540px;
  max-height: calc(100dvh - 32px);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

@media (max-width: 640px) {
  .modal-sheet {
    max-width: 100%;
    max-height: 88dvh;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
  }
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--aqua-mist-light);
  color: var(--aqua-mist-dark);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.subtitle {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-full);
  transition: var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sheet-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-row {
  display: flex;
  gap: 12px;
}

.flex-1 {
  flex: 1;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 5px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inline-icon {
  color: var(--text-muted);
}

.text-link-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.76rem;
  cursor: pointer;
  font-weight: 500;
}

.input-field,
.select-field {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.88rem;
  outline: none;
  transition: var(--transition-fast);
}

.input-field:focus,
.select-field:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-subtle);
}

.stepper-input {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  overflow: hidden;
  height: 40px;
}

.stepper-btn {
  width: 38px;
  height: 100%;
  background: var(--bg-subtle);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.stepper-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.stepper-field {
  flex: 1;
  text-align: center;
  border: none;
  background: transparent;
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--text-primary);
  outline: none;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 110px;
  overflow-y: auto;
  padding: 2px 0;
}

.cat-pill {
  border: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.cat-pill:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.cat-pill.active {
  background: var(--primary);
  color: var(--text-primary);
  border-color: var(--primary);
  font-weight: 700;
}

.quick-expiry-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.quick-title {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.quick-btn {
  background: var(--seashell-dark);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  font-size: 0.72rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.quick-btn:hover {
  background: var(--mint-bloom-light);
  color: var(--mint-bloom-dark);
  border-color: var(--mint-bloom);
}

.nutrition-section {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  background: var(--bg-subtle);
}

.nutrition-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.toggle-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.flame-icon {
  color: #f97316;
}

.nutrition-fields {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-estimate-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-ai-estimate {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--light-iris-light);
  border: 1px solid var(--light-iris);
  color: var(--light-iris-dark);
  border-radius: var(--radius-full);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-ai-estimate:hover:not(:disabled) {
  background: var(--light-iris);
  color: #ffffff;
}

.estimate-notice {
  font-size: 0.72rem;
  color: var(--mint-bloom-dark);
}

.macros-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

@media (max-width: 480px) {
  .macros-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.macro-cell {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.macro-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 600;
}

.macro-input-wrap {
  display: flex;
  align-items: center;
  gap: 3px;
}

.macro-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  outline: none;
}

.macro-suffix {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.sheet-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
}

.btn-delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #dc2626;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: #dc2626;
}

.footer-primary-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
