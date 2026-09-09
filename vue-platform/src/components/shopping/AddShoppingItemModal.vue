<script setup lang="ts">
import { ref, computed } from 'vue';
import { useShoppingStore } from '@/stores/shopping';
import { useCurrentLanguage } from '@/composables/useCurrentLanguage';
import { getUnitOptions, normalizeUnit } from '@/utils/unitStandards';
import { ShoppingCart, X, Plus } from '@lucide/vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const shoppingStore = useShoppingStore();
const { currentLanguage } = useCurrentLanguage();

const name = ref('');
const quantity = ref(1);
const unit = ref('pcs');
const category = ref('other');
const isSubmitting = ref(false);

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

const handleSubmit = async () => {
  if (!name.value.trim()) return;
  isSubmitting.value = true;
  const success = await shoppingStore.addItem({
    name: name.value.trim(),
    quantity: quantity.value,
    unit: normalizeUnit(unit.value),
    category: category.value
  });
  isSubmitting.value = false;
  if (success) {
    emit('close');
  }
};

</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="glass-card modal-card fade-in">
      <div class="modal-header">
        <div class="header-title">
          <ShoppingCart :size="18" class="header-icon" />
          <h3>Додати до списку покупок</h3>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="item-name">Назва товару *</label>
          <input
            id="item-name"
            v-model="name"
            type="text"
            class="form-input"
            placeholder="Масло, Кава, Томати..."
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group flex-2">
            <label class="form-label" for="item-qty">Кількість</label>
            <input
              id="item-qty"
              v-model.number="quantity"
              type="number"
              step="0.001"
              min="0.001"
              class="form-input"
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label" for="item-unit">Одиниця</label>
            <select id="item-unit" v-model="unit" class="form-input">
              <option v-for="u in unitOptions" :key="u.value" :value="u.value">{{ u.label }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="item-cat">Категорія</label>
          <select id="item-cat" v-model="category" class="form-input">
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
          </select>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-ghost" @click="emit('close')">Скасувати</button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting || !name.trim()">
            <Plus :size="16" />
            <span>{{ isSubmitting ? 'Додавання...' : 'Додати товар' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</Teleport>
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
  max-width: min(540px, 95vw);
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

@media (max-width: 440px) {
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
