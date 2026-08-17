<script setup lang="ts">
import { ref } from 'vue';
import { useProductStore } from '@/stores/product';
import { useI18n } from '@/i18n';
import BarcodeScannerModal, { type ScannedProduct } from '@/components/products/BarcodeScannerModal.vue';
import { Plus, X, Package, ScanBarcode } from '@lucide/vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const productStore = useProductStore();
const { t } = useI18n();

const name = ref('');
const description = ref('');
const quantity = ref(1);
const unit = ref('pcs');
const expiryDate = ref('');
const category = ref('other');
const isSubmitting = ref(false);
const showScannerModal = ref(false);

const categories = [
  'dairy', 'fruits', 'vegetables', 'meat', 'poultry', 
  'seafood', 'bakery', 'beverages', 'condiments', 'other'
];

const units = ['pcs', 'kg', 'g', 'l', 'ml', 'pack'];

const handleBarcodeResolved = (scanned: ScannedProduct) => {
  name.value = scanned.name;
  quantity.value = scanned.quantity;
  if (units.includes(scanned.unit)) {
    unit.value = scanned.unit;
  }
  if (categories.includes(scanned.category)) {
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
    category: category.value
  });
  isSubmitting.value = false;
  if (success) {
    emit('close');
  }
};
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card nordic-card fade-in">
      <div class="modal-header">
        <div class="header-title">
          <Package :size="18" class="header-icon" />
          <h3>{{ t('addProductModalTitle') || 'Додати продукт в холодильник' }}</h3>
        </div>

        <div class="header-actions">
          <button
            type="button"
            class="scan-btn"
            title="Сканувати штрих-код"
            @click="showScannerModal = true"
          >
            <ScanBarcode :size="14" />
            <span>{{ t('barcodeScannerTitle') || 'Штрих-код' }}</span>
          </button>
          <button class="close-btn" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="prod-name">{{ t('productName') || 'Назва продукту' }} *</label>
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
            <label class="form-label" for="prod-qty">{{ t('quantity') || 'Кількість' }} *</label>
            <input
              id="prod-qty"
              v-model.number="quantity"
              type="number"
              step="0.1"
              min="0.1"
              class="form-input"
              required
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label" for="prod-unit">{{ t('unit') || 'Од.' }}</label>
            <select id="prod-unit" v-model="unit" class="form-input">
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label" for="prod-cat">{{ t('category') || 'Категорія' }}</label>
            <select id="prod-cat" v-model="category" class="form-input">
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label class="form-label" for="prod-expiry">{{ t('expiryDate') || 'Придатний до' }}</label>
            <input
              id="prod-expiry"
              v-model="expiryDate"
              type="date"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="prod-desc">{{ t('note') || 'Примітка' }}</label>
          <input
            id="prod-desc"
            v-model="description"
            type="text"
            class="form-input"
            placeholder="Органічне, 2.5%..."
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary btn-sm" @click="emit('close')">{{ t('actionCancel') || 'Скасувати' }}</button>
          <button type="submit" class="btn-primary btn-sm" :disabled="isSubmitting">
            <Plus :size="14" />
            <span>{{ isSubmitting ? (t('actionSaving') || 'Збереження...') : (t('actionAdd') || 'Додати') }}</span>
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
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 440px;
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

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title h3 {
  font-size: 0.95rem;
  font-weight: 600;
}

.header-icon {
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scan-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 500;
  transition: var(--transition-fast);
}

.scan-btn:hover {
  background: var(--primary);
  color: var(--primary-foreground);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  gap: 10px;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}
</style>
