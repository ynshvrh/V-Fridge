<script setup lang="ts">
import { ref } from 'vue';
import type { ParsedShoppingItem } from '@/composables/useRecipeParser';
import { ShoppingBag, Plus, Check } from '@lucide/vue';

const props = defineProps<{
  items: ParsedShoppingItem[];
}>();

const emit = defineEmits<{
  (e: 'add-item', item: ParsedShoppingItem): void;
  (e: 'add-all', items: ParsedShoppingItem[]): void;
}>();

const addedIndices = ref<Set<number>>(new Set());
const addedAll = ref(false);

const handleAddOne = (item: ParsedShoppingItem, index: number) => {
  emit('add-item', item);
  addedIndices.value.add(index);
};

const handleAddAll = () => {
  emit('add-all', props.items);
  addedAll.value = true;
  props.items.forEach((_, idx) => addedIndices.value.add(idx));
};
</script>

<template>
  <div v-if="items.length > 0" class="shopping-suggestions nordic-card">
    <div class="suggestions-header">
      <div class="header-title">
        <ShoppingBag :size="14" class="bag-icon" />
        <h5>Не вистачає інгредієнтів (до покупок):</h5>
      </div>

      <button
        v-if="items.length > 1"
        type="button"
        class="btn-add-all"
        :disabled="addedAll"
        @click="handleAddAll"
      >
        <Check v-if="addedAll" :size="12" />
        <Plus v-else :size="12" />
        <span>{{ addedAll ? 'Додано всі' : 'Додати всі' }}</span>
      </button>
    </div>

    <div class="items-grid">
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="shopping-item-chip"
      >
        <span class="item-name">{{ item.name }}</span>
        <button
          type="button"
          class="btn-add-item"
          :disabled="addedIndices.has(idx)"
          @click="handleAddOne(item, idx)"
        >
          <Check v-if="addedIndices.has(idx)" :size="12" class="text-success" />
          <Plus v-else :size="12" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shopping-suggestions {
  margin-top: 8px;
  padding: 12px;
  background: var(--bg-surface);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-title h5 {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.bag-icon {
  color: var(--primary);
}

.btn-add-all {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-add-all:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-add-all:disabled {
  opacity: 0.7;
  cursor: default;
}

.items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.shopping-item-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.item-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-add-item {
  background: transparent;
  border: none;
  color: var(--primary);
  padding: 2px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.btn-add-item:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn-add-item:disabled {
  color: var(--text-muted);
  cursor: default;
}

.text-success {
  color: #22c55e;
}
</style>
