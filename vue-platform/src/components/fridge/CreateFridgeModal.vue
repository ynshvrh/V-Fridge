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
          <Refrigerator :size="20" class="header-icon" />
          <h3>Create New Fridge</h3>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="fridge-name">Fridge Name</label>
          <input
            id="fridge-name"
            v-model="name"
            type="text"
            class="form-input"
            placeholder="Office Pantry, Summer Cottage, Home..."
            required
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting">
            <Plus :size="16" />
            <span>{{ isSubmitting ? 'Creating...' : 'Create' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-card {
  width: 100%;
  max-width: 420px;
  padding: 24px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon {
  color: var(--accent-orange);
}
.close-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
</style>
