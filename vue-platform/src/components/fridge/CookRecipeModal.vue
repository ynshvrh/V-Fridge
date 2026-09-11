<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { type ProductDeductionItem, useProductStore } from '@/stores/product';
import { formatUnit } from '@/utils/unitStandards';
import { useCurrentLanguage } from '@/composables/useCurrentLanguage';
import {
  Utensils,
  X,
  Plus,
  Minus,
  AlertCircle,
  Loader2,
  Flame,
  CheckCircle2,
  HelpCircle,
  Trash2
} from '@lucide/vue';

export interface RecipePayload {
  name: string;
  description?: string | null;
  portions?: number;
  structuredIngredients?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    category?: string;
  }>;
  ingredients?: string[];
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  expiryDays?: number;
  savedRecipeId?: number;
}

const props = defineProps<{
  recipe: RecipePayload;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'cooked', res: any): void;
}>();

const productStore = useProductStore();
const { currentLanguage } = useCurrentLanguage();

const portions = ref(props.recipe.portions || 2);
const expiryDays = ref(props.recipe.expiryDays || 3);
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const successData = ref<any | null>(null);

// Editable ingredient row
interface DeductionRow {
  id: string;
  name: string;
  neededQuantity?: number;
  neededUnit?: string;
  productId: number | null;
  fridgeStock: number;
  fridgeUnit: string;
  deductQuantity: number;
  selected: boolean;
  isExtra?: boolean;
}

const deductionRows = ref<DeductionRow[]>([]);
const selectedExtraProductId = ref<number | ''>('');

// Normalizes name for matching
const normalize = (str: string) => str.trim().toLowerCase();

onMounted(async () => {
  if (productStore.products.length === 0) {
    await productStore.fetchProducts(true);
  }
  initDeductionRows();
});

const initDeductionRows = () => {
  const rows: DeductionRow[] = [];
  const fridgeProducts = productStore.products;

  // Process structured ingredients first
  const structured = props.recipe.structuredIngredients || [];
  if (structured.length > 0) {
    structured.forEach((ing, idx) => {
      const ingNorm = normalize(ing.name);
      const matched = fridgeProducts.find(p => {
        const pNorm = normalize(p.name);
        return pNorm === ingNorm || pNorm.includes(ingNorm) || ingNorm.includes(pNorm);
      });

      const qty = ing.quantity || 1;
      const fridgeStock = matched ? matched.quantity : 0;
      const defaultDeduct = matched ? Math.min(qty, fridgeStock) : qty;

      rows.push({
        id: `recipe-struct-${idx}`,
        name: ing.name,
        neededQuantity: ing.quantity,
        neededUnit: ing.unit,
        productId: matched ? matched.id : null,
        fridgeStock,
        fridgeUnit: matched ? matched.unit : (ing.unit || 'од'),
        deductQuantity: defaultDeduct,
        selected: !!matched,
        isExtra: false
      });
    });
  } else if (props.recipe.ingredients && props.recipe.ingredients.length > 0) {
    props.recipe.ingredients.forEach((raw, idx) => {
      const ingNorm = normalize(raw);
      const matched = fridgeProducts.find(p => {
        const pNorm = normalize(p.name);
        return pNorm === ingNorm || ingNorm.includes(pNorm) || pNorm.includes(ingNorm);
      });

      const fridgeStock = matched ? matched.quantity : 0;
      rows.push({
        id: `recipe-raw-${idx}`,
        name: raw,
        productId: matched ? matched.id : null,
        fridgeStock,
        fridgeUnit: matched ? matched.unit : 'од',
        deductQuantity: matched ? Math.min(1, fridgeStock) : 1,
        selected: !!matched,
        isExtra: false
      });
    });
  }

  deductionRows.value = rows;
};

// Available fridge products that aren't already deducted
const availableFridgeProducts = computed(() => {
  const usedIds = new Set(
    deductionRows.value.filter(r => r.productId !== null).map(r => r.productId)
  );
  return productStore.products.filter(p => !usedIds.has(p.id) && p.quantity > 0);
});

const handleAddExtraProduct = () => {
  if (!selectedExtraProductId.value) return;
  const prod = productStore.products.find(p => p.id === selectedExtraProductId.value);
  if (!prod) return;

  deductionRows.value.push({
    id: `extra-${Date.now()}-${prod.id}`,
    name: prod.name,
    productId: prod.id,
    fridgeStock: prod.quantity,
    fridgeUnit: prod.unit,
    deductQuantity: Math.min(1, prod.quantity),
    selected: true,
    isExtra: true
  });

  selectedExtraProductId.value = '';
};

const handleRemoveRow = (rowId: string) => {
  deductionRows.value = deductionRows.value.filter(r => r.id !== rowId);
};

const adjustRowQuantity = (row: DeductionRow, delta: number) => {
  const step = row.deductQuantity < 1 ? 0.1 : 1;
  const next = Math.max(0.01, parseFloat((row.deductQuantity + delta * step).toFixed(2)));
  row.deductQuantity = next;
};

// Effective nutrition scaled to portions
const caloriesPerPortion = computed(() => props.recipe.calories || 0);
const proteinPerPortion = computed(() => props.recipe.protein || 0);
const fatPerPortion = computed(() => props.recipe.fat || 0);
const carbsPerPortion = computed(() => props.recipe.carbs || 0);
const hasNutrition = computed(() => caloriesPerPortion.value > 0 || proteinPerPortion.value > 0);

const handleCook = async () => {
  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    // Build explicit itemsToDeduct list from user's selection
    const itemsToDeduct: ProductDeductionItem[] = [];

    deductionRows.value.forEach(row => {
      if (row.selected && row.productId !== null && row.deductQuantity > 0) {
        itemsToDeduct.push({
          productId: row.productId,
          name: row.name,
          quantity: row.deductQuantity,
          unit: row.fridgeUnit
        });
      }
    });

    const res = await productStore.cookRecipe({
      name: props.recipe.name,
      description: props.recipe.description,
      portions: portions.value,
      structuredIngredients: props.recipe.structuredIngredients,
      ingredients: props.recipe.ingredients,
      itemsToDeduct: itemsToDeduct.length > 0 ? itemsToDeduct : undefined,
      caloriesPerPortion: caloriesPerPortion.value || undefined,
      proteinPerPortion: proteinPerPortion.value || undefined,
      fatPerPortion: fatPerPortion.value || undefined,
      carbsPerPortion: carbsPerPortion.value || undefined,
      expiryDays: expiryDays.value,
      savedRecipeId: props.recipe.savedRecipeId,
      ignoreOptionalMissing: true
    });

    if (res) {
      successData.value = res;
      emit('cooked', res);
      setTimeout(() => {
        emit('close');
      }, 2000);
    } else if (productStore.error) {
      errorMessage.value = productStore.error;
    }
  } catch (err: any) {
    errorMessage.value = err?.error || err?.message || 'Не вдалося приготувати страву';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-card glass-card fade-in">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-title">
            <div class="header-icon-wrap">
              <Utensils :size="18" />
            </div>
            <div>
              <h3>Приготувати «{{ recipe.name }}»</h3>
              <p class="header-sub">Оберіть та налаштуйте списання інгредієнтів</p>
            </div>
          </div>
          <button class="close-btn" aria-label="Закрити" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <!-- Success Animation Card -->
        <div v-if="successData" class="success-screen fade-in">
          <div class="success-icon-wrap">
            <CheckCircle2 :size="48" class="success-icon" />
          </div>
          <h4 class="success-title">Страву успішно приготовано!</h4>
          <p class="success-msg">{{ successData.message }}</p>

          <div v-if="successData.deductions && successData.deductions.length > 0" class="deductions-summary">
            <h5>Списано з холодильника:</h5>
            <ul>
              <li v-for="d in successData.deductions" :key="d.rawIngredient">
                <strong>{{ d.matchedProductName || d.rawIngredient }}</strong>:
                {{ d.deductedQuantity }} {{ d.unit }}
              </li>
            </ul>
          </div>

          <p class="success-hint">
            Додано до холодильника як «{{ successData.preparedMealProduct?.name }}» ({{ portions }} порц.).
          </p>
        </div>

        <!-- Main Form Body -->
        <div v-else class="modal-body">
          <!-- Portions & Expiry Row -->
          <div class="config-grid">
            <div class="config-cell">
              <label class="cell-label">Кількість порцій</label>
              <div class="stepper-wrap">
                <button
                  type="button"
                  class="step-btn"
                  :disabled="portions <= 1"
                  @click="portions = Math.max(1, portions - 1)"
                >
                  <Minus :size="14" />
                </button>
                <span class="step-val">{{ portions }}</span>
                <button
                  type="button"
                  class="step-btn"
                  :disabled="portions >= 20"
                  @click="portions = Math.min(20, portions + 1)"
                >
                  <Plus :size="14" />
                </button>
              </div>
            </div>

            <div class="config-cell">
              <label class="cell-label">Зберігання (днів)</label>
              <div class="stepper-wrap">
                <button
                  type="button"
                  class="step-btn"
                  :disabled="expiryDays <= 1"
                  @click="expiryDays = Math.max(1, expiryDays - 1)"
                >
                  <Minus :size="14" />
                </button>
                <span class="step-val">{{ expiryDays }} дн.</span>
                <button
                  type="button"
                  class="step-btn"
                  :disabled="expiryDays >= 14"
                  @click="expiryDays = Math.min(14, expiryDays + 1)"
                >
                  <Plus :size="14" />
                </button>
              </div>
            </div>
          </div>

          <!-- Nutrition Preview if available -->
          <div v-if="hasNutrition" class="nutrition-pill-bar">
            <div class="bar-tag">
              <Flame :size="13" class="flame" />
              <span>На 1 порцію:</span>
            </div>
            <div class="macros-list">
              <span class="m-val">{{ caloriesPerPortion }} ккал</span>
              <span class="m-div">•</span>
              <span class="m-val">Б: {{ proteinPerPortion }}г</span>
              <span class="m-div">•</span>
              <span class="m-val">Ж: {{ fatPerPortion }}г</span>
              <span class="m-div">•</span>
              <span class="m-val">В: {{ carbsPerPortion }}г</span>
            </div>
          </div>

          <!-- Ingredients Deduction Section -->
          <div class="ingredients-section">
            <div class="section-title-row">
              <div class="title-with-badge">
                <h4>Інгредієнти та списання</h4>
                <span class="badge-hint">гнучке списання</span>
              </div>
              <p class="section-note">
                Виберіть, які продукти списати з холодильника та в якій кількості.
              </p>
            </div>

            <!-- List of rows -->
            <div class="deduction-list">
              <div
                v-for="row in deductionRows"
                :key="row.id"
                class="deduction-item"
                :class="{ 'not-in-fridge': !row.productId, 'is-selected': row.selected }"
              >
                <div class="item-main">
                  <!-- Checkbox (enabled only if product is in fridge) -->
                  <label class="item-checkbox-wrap">
                    <input
                      v-if="row.productId"
                      v-model="row.selected"
                      type="checkbox"
                      class="custom-check"
                    />
                    <span v-else class="missing-marker" title="Не знайдено в холодильнику">
                      <HelpCircle :size="16" />
                    </span>
                  </label>

                  <!-- Name and info -->
                  <div class="item-info">
                    <div class="item-name-row">
                      <span class="item-name">{{ row.name }}</span>
                      <span v-if="row.isExtra" class="extra-badge">додатково</span>
                    </div>

                    <div class="item-sub-info">
                      <span v-if="row.productId" class="stock-badge">
                        В наявності: {{ row.fridgeStock }} {{ formatUnit(row.fridgeUnit, currentLanguage) }}
                      </span>
                      <span v-else class="missing-badge">
                        Немає в холодильнику (буде пропущено)
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Stepper for deduction quantity (if matched and selected) -->
                <div v-if="row.productId && row.selected" class="item-stepper">
                  <button
                    type="button"
                    class="mini-btn"
                    @click="adjustRowQuantity(row, -1)"
                  >
                    <Minus :size="12" />
                  </button>
                  <input
                    v-model.number="row.deductQuantity"
                    type="number"
                    step="any"
                    min="0.01"
                    :max="row.fridgeStock"
                    class="mini-input"
                  />
                  <span class="mini-unit">{{ formatUnit(row.fridgeUnit, currentLanguage) }}</span>
                  <button
                    type="button"
                    class="mini-btn"
                    @click="adjustRowQuantity(row, 1)"
                  >
                    <Plus :size="12" />
                  </button>
                </div>

                <button
                  v-if="row.isExtra"
                  type="button"
                  class="remove-extra-btn"
                  title="Вилучити"
                  @click="handleRemoveRow(row.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </div>
            </div>

            <!-- Add additional product dropdown -->
            <div v-if="availableFridgeProducts.length > 0" class="add-extra-row">
              <select v-model="selectedExtraProductId" class="extra-select">
                <option value="" disabled>+ Додати інший продукт з холодильника...</option>
                <option
                  v-for="prod in availableFridgeProducts"
                  :key="prod.id"
                  :value="prod.id"
                >
                  {{ prod.name }} (залишок: {{ prod.quantity }} {{ prod.unit }})
                </option>
              </select>
              <button
                type="button"
                class="btn-add-extra"
                :disabled="!selectedExtraProductId"
                @click="handleAddExtraProduct"
              >
                <Plus :size="14" />
                <span>Додати</span>
              </button>
            </div>
          </div>

          <!-- Error notice -->
          <div v-if="errorMessage" class="error-banner">
            <AlertCircle :size="16" />
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="!successData" class="modal-footer">
          <button type="button" class="btn-ghost" @click="emit('close')">
            Скасувати
          </button>
          <button
            type="button"
            class="btn-primary btn-cook-action"
            :disabled="isSubmitting"
            @click="handleCook"
          >
            <Loader2 v-if="isSubmitting" :size="16" class="spin" />
            <Utensils v-else :size="16" />
            <span>{{ isSubmitting ? 'Готуємо...' : 'Списати та приготувати' }}</span>
          </button>
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

.modal-card {
  width: 100%;
  max-width: 580px;
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
  .modal-card {
    max-width: 100%;
    max-height: 90dvh;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
  }
}

.modal-header {
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

.header-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  background: var(--june-bud-light);
  color: var(--june-bud-dark);
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

.header-sub {
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

.modal-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.config-cell {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-label {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--text-muted);
}

.stepper-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-btn {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-xs);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
}

.step-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.step-val {
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--text-primary);
}

.nutrition-pill-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--seashell-dark);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  font-size: 0.78rem;
}

.bar-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.flame {
  color: #f97316;
}

.macros-list {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
  font-weight: 600;
}

.m-div {
  color: var(--text-muted);
}

.ingredients-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-with-badge h4 {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.badge-hint {
  font-size: 0.68rem;
  background: var(--mint-bloom-light);
  color: var(--mint-bloom-dark);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.section-note {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
}

.deduction-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 2px;
}

.deduction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.deduction-item.is-selected {
  background: var(--bg-surface);
  border-color: var(--primary);
}

.deduction-item.not-in-fridge {
  opacity: 0.65;
  background: var(--bg-subtle);
}

.item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.item-checkbox-wrap {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.custom-check {
  width: 17px;
  height: 17px;
  accent-color: var(--primary);
  cursor: pointer;
}

.missing-marker {
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-name {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.extra-badge {
  font-size: 0.65rem;
  background: var(--aqua-mist-light);
  color: var(--aqua-mist-dark);
  padding: 1px 5px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.item-sub-info {
  font-size: 0.72rem;
}

.stock-badge {
  color: var(--mint-bloom-dark);
}

.missing-badge {
  color: var(--text-muted);
  font-style: italic;
}

.item-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  padding: 2px 4px;
}

.mini-btn {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-xs);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-primary);
}

.mini-btn:hover {
  background: var(--bg-hover);
}

.mini-input {
  width: 44px;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  outline: none;
}

.mini-unit {
  font-size: 0.72rem;
  color: var(--text-muted);
  padding-right: 2px;
}

.remove-extra-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-xs);
}

.remove-extra-btn:hover {
  color: #dc2626;
}

.add-extra-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.extra-select {
  flex: 1;
  height: 34px;
  padding: 0 10px;
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.78rem;
  outline: none;
}

.btn-add-extra {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 34px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-add-extra:hover:not(:disabled) {
  background: var(--primary);
  border-color: var(--primary);
}

.btn-add-extra:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  color: #dc2626;
  font-size: 0.78rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
}

.btn-cook-action {
  min-width: 180px;
}

.success-screen {
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.success-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--mint-bloom-light);
  color: var(--mint-bloom-dark);
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.success-msg {
  font-size: 0.84rem;
  color: var(--text-secondary);
  margin: 0;
}

.deductions-summary {
  width: 100%;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  text-align: left;
  font-size: 0.78rem;
}

.deductions-summary h5 {
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: var(--text-primary);
}

.deductions-summary ul {
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
}

.success-hint {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin: 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
