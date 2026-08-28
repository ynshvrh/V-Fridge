<script setup lang="ts">
import { ref } from 'vue';
import type { ParsedRecipe } from '@/composables/useRecipeParser';
import { useProductStore } from '@/stores/product';
import { Utensils, X, Plus, Minus, Check, AlertCircle, Loader2 } from '@lucide/vue';

const props = defineProps<{
  recipe: ParsedRecipe;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'cooked'): void;
}>();

const productStore = useProductStore();

const portions = ref(props.recipe.portions || 2);
const expiryDays = ref(3);
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const handleCook = async () => {
  isSubmitting.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const res = await productStore.cookRecipe({
      name: props.recipe.name,
      description: props.recipe.description,
      portions: portions.value,
      ingredients: props.recipe.ingredients,
      caloriesPerPortion: props.recipe.calories,
      proteinPerPortion: props.recipe.protein,
      fatPerPortion: props.recipe.fat,
      carbsPerPortion: props.recipe.carbs,
      expiryDays: expiryDays.value
    });

    if (res) {
      successMessage.value = res.message;
      emit('cooked');
      setTimeout(() => {
        emit('close');
      }, 1500);
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
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card glass-card fade-in">
      <div class="modal-header">
        <div class="header-title">
          <Utensils :size="18" class="header-icon" />
          <h3>Приготувати «{{ recipe.name }}»</h3>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="16" />
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-intro">
          Інгредієнти будуть списані з вашого холодильника, а готову страву на <strong>{{ portions }}</strong> порц. додано до інвентарю.
        </p>

        <!-- Portions Selector -->
        <div class="form-group">
          <label class="form-label">Кількість порцій:</label>
          <div class="stepper-row">
            <button
              type="button"
              class="stepper-btn"
              :disabled="portions <= 1"
              @click="portions = Math.max(1, portions - 1)"
            >
              <Minus :size="14" />
            </button>
            <span class="stepper-val">{{ portions }}</span>
            <button
              type="button"
              class="stepper-btn"
              :disabled="portions >= 20"
              @click="portions = Math.min(20, portions + 1)"
            >
              <Plus :size="14" />
            </button>
          </div>
        </div>

        <!-- Expiry Days Selector -->
        <div class="form-group">
          <label class="form-label">Строк зберігання в холодильнику (днів):</label>
          <div class="stepper-row">
            <button
              type="button"
              class="stepper-btn"
              :disabled="expiryDays <= 1"
              @click="expiryDays = Math.max(1, expiryDays - 1)"
            >
              <Minus :size="14" />
            </button>
            <span class="stepper-val">{{ expiryDays }} дн.</span>
            <button
              type="button"
              class="stepper-btn"
              :disabled="expiryDays >= 14"
              @click="expiryDays = Math.min(14, expiryDays + 1)"
            >
              <Plus :size="14" />
            </button>
          </div>
        </div>

        <!-- Success/Error Banners -->
        <div v-if="successMessage" class="alert-banner alert-success">
          <Check :size="16" />
          <span>{{ successMessage }}</span>
        </div>

        <div v-if="errorMessage" class="alert-banner alert-error">
          <AlertCircle :size="16" />
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-ghost" @click="emit('close')">Скасувати</button>
        <button
          type="button"
          class="btn-primary"
          :disabled="isSubmitting || !!successMessage"
          @click="handleCook"
        >
          <Loader2 v-if="isSubmitting" :size="15" class="spin" />
          <Utensils v-else :size="15" />
          <span>{{ isSubmitting ? 'Списання...' : 'Підтвердити готування' }}</span>
        </button>
      </div>
    </div>
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
}

.modal-card {
  width: 100%;
  max-width: 440px;
  padding: 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title h3 {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-icon {
  color: var(--primary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-intro {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
}

.form-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-primary);
}

.stepper-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stepper-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.stepper-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stepper-val {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 48px;
  text-align: center;
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  font-size: 0.78rem;
}

.alert-success {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.alert-error {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
