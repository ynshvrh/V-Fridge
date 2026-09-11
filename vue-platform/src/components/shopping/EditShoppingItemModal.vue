<script setup lang="ts">
import { ref, computed } from 'vue';
import { type ShoppingItem, useShoppingStore } from '@/stores/shopping';
import { useCurrentLanguage } from '@/composables/useCurrentLanguage';
import { getUnitOptions } from '@/utils/unitStandards';
import {
  Edit3,
  X,
  Trash2,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Loader2
} from '@lucide/vue';

const props = defineProps<{
  item: ShoppingItem;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
  (e: 'deleted'): void;
}>();

const shoppingStore = useShoppingStore();
const { currentLanguage } = useCurrentLanguage();

const name = ref(props.item.name);
const quantity = ref(props.item.quantity || 1);
const unit = ref(props.item.unit || 'pcs');
const category = ref(props.item.category || 'other');
const isSaving = ref(false);
const isDeleting = ref(false);
const isPurchasing = ref(false);

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
  { id: 'snacks', label: 'Снеки' },
  { id: 'alcohol', label: 'Алкоголь' },
  { id: 'other', label: 'Інше' }
];

const unitOptions = computed(() => getUnitOptions(currentLanguage.value, true));

const adjustQuantity = (delta: number) => {
  const current = quantity.value;
  const step = current < 1 ? 0.1 : 1;
  const next = Math.max(0.01, parseFloat((current + delta * step).toFixed(2)));
  quantity.value = next;
};

const handleSave = async () => {
  if (!name.value.trim()) return;
  isSaving.value = true;
  try {
    const success = await shoppingStore.updateItem(props.item.id, {
      name: name.value.trim(),
      quantity: quantity.value,
      unit: unit.value,
      category: category.value
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
  if (!confirm(`Видалити «${props.item.name}» зі списку покупок?`)) return;
  isDeleting.value = true;
  try {
    const success = await shoppingStore.deleteItem(props.item.id);
    if (success) {
      emit('deleted');
      emit('close');
    }
  } finally {
    isDeleting.value = false;
  }
};

const handlePurchase = async () => {
  isPurchasing.value = true;
  try {
    const success = await shoppingStore.purchaseItem(props.item.id);
    if (success) {
      emit('close');
    }
  } finally {
    isPurchasing.value = false;
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
              <h3>Редагувати покупку</h3>
              <p class="subtitle">Змініть назву, кількість чи категорію</p>
            </div>
          </div>
          <button class="close-btn" aria-label="Закрити" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <!-- Body -->
        <div class="sheet-body">
          <div class="field-group">
            <label class="field-label" for="edit-shop-name">Назва товару</label>
            <input
              id="edit-shop-name"
              v-model="name"
              type="text"
              class="input-field"
              placeholder="Наприклад: Вівсяне молоко"
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

          <!-- Quick Move to Fridge banner -->
          <div class="purchase-callout">
            <div class="callout-info">
              <ShoppingBag :size="16" class="callout-icon" />
              <span>Вже придбали цей товар?</span>
            </div>
            <button
              type="button"
              class="btn-callout-purchase"
              :disabled="isPurchasing"
              @click="handlePurchase"
            >
              <Loader2 v-if="isPurchasing" :size="13" class="spin" />
              <span>{{ isPurchasing ? 'Переміщення...' : 'Перемістити в холодильник' }}</span>
            </button>
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
              :disabled="isSaving || isDeleting || !name.trim()"
              @click="handleSave"
            >
              <Loader2 v-if="isSaving" :size="15" class="spin" />
              <Check v-else :size="15" />
              <span>{{ isSaving ? 'Збереження...' : 'Зберегти' }}</span>
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
  max-width: 520px;
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
  background: var(--mint-bloom-light);
  color: var(--mint-bloom-dark);
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

.purchase-callout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: var(--seashell-dark);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-top: 4px;
}

.callout-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.callout-icon {
  color: var(--mint-bloom-dark);
}

.btn-callout-purchase {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--mint-bloom-light);
  border: 1px solid var(--mint-bloom);
  color: var(--mint-bloom-dark);
  padding: 6px 12px;
  border-radius: var(--radius-xs);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.btn-callout-purchase:hover:not(:disabled) {
  background: var(--mint-bloom);
  color: #1b4332;
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
