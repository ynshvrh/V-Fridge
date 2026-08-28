<script setup lang="ts">
import { ref } from 'vue';
import type { NutritionTargets } from '@/stores/nutrition';
import { X, Loader2 } from '@lucide/vue';

const props = defineProps<{
  targets: NutritionTargets;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', targets: {
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  }): void;
}>();

const targetCalories = ref(props.targets.calories?.toString() ?? '2000');
const targetProtein = ref(props.targets.protein?.toString() ?? '120');
const targetFat = ref(props.targets.fat?.toString() ?? '65');
const targetCarbs = ref(props.targets.carbs?.toString() ?? '200');
const submitting = ref(false);

const handleSubmit = () => {
  submitting.value = true;
  emit('submit', {
    calories: targetCalories.value ? Number(targetCalories.value) : null,
    protein: targetProtein.value ? Number(targetProtein.value) : null,
    fat: targetFat.value ? Number(targetFat.value) : null,
    carbs: targetCarbs.value ? Number(targetCarbs.value) : null
  });
};
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Денні цілі КБЖВ</h3>
        <button class="close-modal-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label class="form-label font-bold">Денна ціль калорій (кКал)</label>
          <input v-model="targetCalories" type="number" min="0" class="form-input font-bold" required />
        </div>

        <div class="macros-inputs-grid">
          <div class="form-group">
            <label class="form-label protein-text">Білки (г)</label>
            <input v-model="targetProtein" type="number" min="0" class="form-input text-center" />
          </div>
          <div class="form-group">
            <label class="form-label fat-text">Жири (г)</label>
            <input v-model="targetFat" type="number" min="0" class="form-input text-center" />
          </div>
          <div class="form-group">
            <label class="form-label carbs-text">Вуглеводи (г)</label>
            <input v-model="targetCarbs" type="number" min="0" class="form-input text-center" />
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="emit('close')">Скасувати</button>
          <button type="submit" class="btn-primary" :disabled="submitting">
            <Loader2 v-if="submitting" :size="16" class="animate-spin" />
            <span>Зберегти цілі</span>
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
  max-width: 400px;
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

.font-bold {
  font-weight: 700;
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

.macros-inputs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
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
