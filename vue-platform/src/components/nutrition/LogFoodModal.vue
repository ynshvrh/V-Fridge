<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { NutritionLog } from '@/stores/nutrition';
import { useProductStore } from '@/stores/product';
import { X, Refrigerator, AlertTriangle, Loader2 } from '@lucide/vue';

const props = defineProps<{
  editingLog?: NutritionLog | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', data: {
    mealType: string;
    foodName: string;
    quantity: number | null;
    unit: string | null;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    productId: number | null;
  }): void;
}>();

const productStore = useProductStore();

const selectedProductId = ref<number | null>(null);
const foodName = ref(props.editingLog?.foodName ?? '');
const mealType = ref(props.editingLog?.mealType ?? 'breakfast');
const quantity = ref(props.editingLog?.quantity?.toString() ?? '100');
const unit = ref(props.editingLog?.unit ?? 'g');
const calories = ref(props.editingLog?.calories?.toString() ?? '0');
const protein = ref(props.editingLog?.protein?.toString() ?? '0');
const fat = ref(props.editingLog?.fat?.toString() ?? '0');
const carbs = ref(props.editingLog?.carbs?.toString() ?? '0');
const submitting = ref(false);

onMounted(async () => {
  if (productStore.products.length === 0) {
    await productStore.fetchProducts();
  }
});

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

const handleSubmit = () => {
  if (!foodName.value.trim()) return;
  submitting.value = true;
  emit('submit', {
    mealType: mealType.value,
    foodName: foodName.value.trim(),
    quantity: quantity.value ? Number(quantity.value) : null,
    unit: unit.value.trim() || null,
    calories: Number(calories.value) || 0,
    protein: Number(protein.value) || 0,
    fat: Number(fat.value) || 0,
    carbs: Number(carbs.value) || 0,
    productId: selectedProductId.value
  });
};
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ editingLog ? 'Редагувати прийом їжі' : 'Додати прийом їжі' }}</h3>
        <button class="close-modal-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
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
          <AlertTriangle :size="14" />
          <span>При збереженні кількість продукту в холодильнику буде автоматично зменшена на {{ quantity }} {{ unit }}.</span>
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
          <button type="button" class="btn-secondary" @click="emit('close')">Скасувати</button>
          <button type="submit" class="btn-primary" :disabled="submitting">
            <Loader2 v-if="submitting" :size="16" class="animate-spin" />
            <span>Зберегти</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 440px;
  padding: 20px;
  box-shadow: var(--shadow-modal);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.modal-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-modal-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.font-icon-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.orange-icon {
  color: var(--primary);
}

.form-input {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  padding: 8px 10px;
  font-size: 0.84rem;
  color: var(--text-primary);
  outline: none;
}

.form-input:focus {
  border-color: var(--primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.form-row-inner {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 6px;
}

.fridge-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #f59e0b;
  padding: 6px 10px;
  border-radius: var(--radius-xs);
  font-size: 0.72rem;
}

.macros-inputs-block {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.block-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.macros-inputs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.text-center {
  text-align: center;
}

.protein-text { color: #10B981; }
.fat-text { color: #F59E0B; }
.carbs-text { color: #0284C7; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.btn-secondary {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 7px 14px;
  border-radius: var(--radius-xs);
  font-size: 0.82rem;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  border: none;
  color: white;
  padding: 7px 14px;
  border-radius: var(--radius-xs);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
