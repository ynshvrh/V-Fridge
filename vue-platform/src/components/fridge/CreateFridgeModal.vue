<script setup lang="ts">
import { ref } from 'vue';
import { useFridgeStore } from '@/stores/fridge';
import { useProductStore } from '@/stores/product';
import { Refrigerator, X, Plus } from '@lucide/vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const fridgeStore = useFridgeStore();
const productStore = useProductStore();

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
    <div class="glass-card modal-card fade-in">
      <div class="modal-header">
        <div class="header-title">
          <Refrigerator :size="18" class="header-icon" />
          <h3>Створити холодильник</h3>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="fridge-name">Назва холодильника *</label>
          <input
            id="fridge-name"
            v-model="name"
            type="text"
            class="form-input"
            placeholder="Дім, Дача, Офіс..."
            required
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-ghost" @click="emit('close')">Скасувати</button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting || !name.trim()">
            <Plus :size="16" />
            <span>{{ isSubmitting ? 'Створення...' : 'Створити' }}</span>
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
  max-width: min(520px, 95vw);
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
</style>
