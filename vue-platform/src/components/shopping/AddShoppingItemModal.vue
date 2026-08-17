<script setup lang="ts">
import { ref } from 'vue';
import { useShoppingStore } from '@/stores/shopping';
import { useI18n } from '@/i18n';
import { ShoppingCart, X, Plus } from '@lucide/vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const shoppingStore = useShoppingStore();
const { t } = useI18n();

const name = ref('');
const quantity = ref(1);
const unit = ref('pcs');
const category = ref('other');
const isSubmitting = ref(false);

const categories = [
  'dairy', 'fruits', 'vegetables', 'meat', 'poultry', 
  'seafood', 'bakery', 'beverages', 'condiments', 'other'
];

const units = ['pcs', 'kg', 'g', 'l', 'ml', 'pack'];

const handleSubmit = async () => {
  if (!name.value.trim()) return;
  isSubmitting.value = true;
  const success = await shoppingStore.addItem({
    name: name.value.trim(),
    quantity: quantity.value,
    unit: unit.value,
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
          <ShoppingCart :size="18" class="header-icon" />
          <h3>{{ t('addShoppingModalTitle') || 'Додати до списку покупок' }}</h3>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="item-name">{{ t('productName') || 'Назва товару' }} *</label>
          <input
            id="item-name"
            v-model="name"
            type="text"
            class="form-input"
            placeholder="Вершкове масло, Кава, Томати..."
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group flex-2">
            <label class="form-label" for="item-qty">{{ t('quantity') || 'Кількість' }}</label>
            <input
              id="item-qty"
              v-model.number="quantity"
              type="number"
              step="0.1"
              min="0.1"
              class="form-input"
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label" for="item-unit">{{ t('unit') || 'Од.' }}</label>
            <select id="item-unit" v-model="unit" class="form-input">
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="item-cat">{{ t('category') || 'Категорія' }}</label>
          <select id="item-cat" v-model="category" class="form-input">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary btn-sm" @click="emit('close')">{{ t('actionCancel') || 'Скасувати' }}</button>
          <button type="submit" class="btn-primary btn-sm" :disabled="isSubmitting">
            <Plus :size="14" />
            <span>{{ isSubmitting ? (t('actionSaving') || 'Додавання...') : (t('actionAdd') || 'Додати') }}</span>
          </button>
        </div>
      </form>
    </div>
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
  max-width: 420px;
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
