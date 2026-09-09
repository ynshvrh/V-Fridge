<script setup lang="ts">
import { ref, computed } from 'vue';
import { useProductStore } from '@/stores/product';
import BarcodeScannerModal, { type ScannedProduct } from '@/components/products/BarcodeScannerModal.vue';
import { useCurrentLanguage } from '@/composables/useCurrentLanguage';
import { getUnitOptions, normalizeUnit } from '@/utils/unitStandards';
import { Plus, X, Package, ScanBarcode, Flame, ChevronDown, ChevronUp } from '@lucide/vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const productStore = useProductStore();
const { currentLanguage } = useCurrentLanguage();

const name = ref('');
const description = ref('');
const quantity = ref(1);
const unit = ref('pcs');
const expiryDate = ref('');
const category = ref('other');
const isSubmitting = ref(false);
const showScannerModal = ref(false);

const calories = ref<number | undefined>(undefined);
const protein = ref<number | undefined>(undefined);
const fat = ref<number | undefined>(undefined);
const carbs = ref<number | undefined>(undefined);
const showNutritionFields = ref(false);

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

const handleBarcodeResolved = (scanned: ScannedProduct) => {
  name.value = scanned.name;
  quantity.value = scanned.quantity;
  if (scanned.unit) {
    unit.value = normalizeUnit(scanned.unit);
  }
  if (categories.some(c => c.id === scanned.category)) {
    category.value = scanned.category;
  }
};


const handleSubmit = async () => {
  if (!name.value || quantity.value <= 0) return;
  isSubmitting.value = true;
  const success = await productStore.addProduct({
    name: name.value.trim(),
    description: description.value.trim() || undefined,
    quantity: quantity.value,
    unit: unit.value,
    expiryDate: expiryDate.value || undefined,
    category: category.value,
    calories: calories.value !== undefined && !isNaN(calories.value) ? calories.value : undefined,
    protein: protein.value !== undefined && !isNaN(protein.value) ? protein.value : undefined,
    fat: fat.value !== undefined && !isNaN(fat.value) ? fat.value : undefined,
    carbs: carbs.value !== undefined && !isNaN(carbs.value) ? carbs.value : undefined
  });
  isSubmitting.value = false;
  if (success) {
    emit('close');
  }
};
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="glass-card modal-card fade-in">
      <div class="modal-header">
        <div class="header-title">
          <Package :size="20" class="header-icon" />
          <h3>Додати продукт в холодильник</h3>
        </div>

        <div class="header-actions">
          <button
            type="button"
            class="scan-btn"
            title="Сканувати штрих-код камери"
            @click="showScannerModal = true"
          >
            <ScanBarcode :size="16" />
            <span>Штрих-код</span>
          </button>
          <button class="close-btn" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="prod-name">Назва продукту *</label>
          <input
            id="prod-name"
            v-model="name"
            type="text"
            class="form-input"
            placeholder="Молоко, Яйця, Авокадо..."
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group flex-2">
            <label class="form-label" for="prod-qty">Кількість *</label>
            <input
              id="prod-qty"
              v-model.number="quantity"
              type="number"
              step="0.001"
              min="0.001"
              class="form-input"
              required
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label" for="prod-unit">Одиниця</label>
            <select id="prod-unit" v-model="unit" class="form-input">
              <option v-for="u in unitOptions" :key="u.value" :value="u.value">{{ u.label }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label" for="prod-cat">Категорія</label>
            <select id="prod-cat" v-model="category" class="form-input">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label class="form-label" for="prod-expiry">Придатний до</label>
            <input
              id="prod-expiry"
              v-model="expiryDate"
              type="date"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="prod-desc">Примітка (необов'язково)</label>
          <input
            id="prod-desc"
            v-model="description"
            type="text"
            class="form-input"
            placeholder="Органічне, 2.5%..."
          />
        </div>

        <!-- Optional Nutrition Section -->
        <div class="nutrition-accordion">
          <button
            type="button"
            class="nutrition-toggle-btn"
            @click="showNutritionFields = !showNutritionFields"
          >
            <div class="nutrition-toggle-label">
              <Flame :size="15" class="flame-icon" />
              <span>Поживна цінність (КБЖВ - необов'язково)</span>
            </div>
            <ChevronUp v-if="showNutritionFields" :size="15" />
            <ChevronDown v-else :size="15" />
          </button>

          <div v-if="showNutritionFields" class="nutrition-inputs-grid fade-in">
            <div class="form-group">
              <label class="form-sublabel">Калорії (ккал)</label>
              <input
                v-model.number="calories"
                type="number"
                min="0"
                step="1"
                class="form-input form-input-sm"
                placeholder="0"
              />
            </div>
            <div class="form-group">
              <label class="form-sublabel">Білки (г)</label>
              <input
                v-model.number="protein"
                type="number"
                min="0"
                step="0.1"
                class="form-input form-input-sm"
                placeholder="0.0"
              />
            </div>
            <div class="form-group">
              <label class="form-sublabel">Жири (г)</label>
              <input
                v-model.number="fat"
                type="number"
                min="0"
                step="0.1"
                class="form-input form-input-sm"
                placeholder="0.0"
              />
            </div>
            <div class="form-group">
              <label class="form-sublabel">Вуглеводи (г)</label>
              <input
                v-model.number="carbs"
                type="number"
                min="0"
                step="0.1"
                class="form-input form-input-sm"
                placeholder="0.0"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-ghost" @click="emit('close')">Скасувати</button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting">
            <Plus :size="16" />
            <span>{{ isSubmitting ? 'Збереження...' : 'Додати' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Barcode Scanner Modal -->
    <BarcodeScannerModal
      :open="showScannerModal"
      @close="showScannerModal = false"
      @resolved="handleBarcodeResolved"
    />
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: min(580px, 95vw);
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  padding: 24px;
  margin: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scan-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.78rem;
  font-weight: 600;
  transition: var(--transition-fast);
}

.scan-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}

.close-btn {
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

.close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.flex-1 { flex: 1; min-width: 0; }
.flex-2 { flex: 2; min-width: 0; }

@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
    gap: 14px;
  }
}

.nutrition-accordion {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  overflow: hidden;
  background: var(--bg-subtle);
}

.nutrition-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  transition: var(--transition-fast);
}

.nutrition-toggle-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nutrition-toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flame-icon {
  color: #e05a47;
}

.nutrition-inputs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

@media (max-width: 480px) {
  .nutrition-inputs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.form-sublabel {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 3px;
  display: block;
}

.form-input-sm {
  padding: 5px 8px;
  font-size: 0.82rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
</style>
