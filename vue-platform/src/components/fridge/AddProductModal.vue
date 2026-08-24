<script setup lang="ts">
import { ref } from 'vue';
import { useProductStore } from '@/stores/product';
import BarcodeScannerModal, { type ScannedProduct } from '@/components/products/BarcodeScannerModal.vue';
import { Plus, X, Package, ScanBarcode } from '@lucide/vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const productStore = useProductStore();

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
              step="0.1"
              min="0.1"
              class="form-input"
              required
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label" for="prod-unit">Одиниця</label>
            <select id="prod-unit" v-model="unit" class="form-input">
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label" for="prod-cat">Категорія</label>
            <select id="prod-cat" v-model="category" class="form-input">
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
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
  max-width: 520px;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
</style>
