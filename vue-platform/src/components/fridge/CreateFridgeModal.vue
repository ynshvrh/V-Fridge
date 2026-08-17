<script setup lang="ts">
import { ref } from 'vue';
import { useFridgeStore } from '@/stores/fridge';
import { useProductStore } from '@/stores/product';
import { useI18n } from '@/i18n';
import { Refrigerator, X, Plus } from '@lucide/vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const fridgeStore = useFridgeStore();
const productStore = useProductStore();
const { t } = useI18n();

const name = ref('');
const isSubmitting = ref(false);

const handleSubmit = async () => {
  if (!name.value.trim()) return;
  isSubmitting.value = true;
  const success = await fridgeStore.createFridge(name.value.trim());
  isSubmitting.value = false;
  if (success) {
    await productStore.fetchProducts();
    emit('close');
  }
};
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card nordic-card fade-in">
      <div class="modal-header">
        <div class="header-title">
          <Refrigerator :size="18" class="header-icon" />
          <h3>{{ t('createFridgeModalTitle') || 'Створити новий холодильник' }}</h3>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="fridge-name">{{ t('fridgeNameLabel') || 'Назва холодильника' }}</label>
          <input
            id="fridge-name"
            v-model="name"
            type="text"
            class="form-input"
            :placeholder="t('fridgeNamePlaceholder') || 'Дім, Офіс, Дача...'"
            required
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary btn-sm" @click="emit('close')">{{ t('actionCancel') || 'Скасувати' }}</button>
          <button type="submit" class="btn-primary btn-sm" :disabled="isSubmitting">
            <Plus :size="14" />
            <span>{{ isSubmitting ? (t('actionSaving') || 'Створення...') : (t('actionCreate') || 'Створити') }}</span>
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
  max-width: 400px;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}
</style>
