<script setup lang="ts">
import { ref } from 'vue';
import { type ShoppingItem, useShoppingStore } from '@/stores/shopping';
import { CheckSquare, Square, ShoppingBag, Trash2, Plus, Minus } from '@lucide/vue';

const props = defineProps<{
  item: ShoppingItem;
}>();

const shoppingStore = useShoppingStore();
const isPurchasing = ref(false);

const toggleCheck = async () => {
  await shoppingStore.toggleCheck(props.item.id, !props.item.checked);
};

const handlePurchase = async () => {
  isPurchasing.value = true;
  await shoppingStore.purchaseItem(props.item.id);
  isPurchasing.value = false;
};

const increaseQuantity = async () => {
  const current = props.item.quantity || 1;
  await shoppingStore.updateItem(props.item.id, { quantity: Number((current + 1).toFixed(2)) });
};

const decreaseQuantity = async () => {
  const current = props.item.quantity || 1;
  const newQty = Number((current - 1).toFixed(2));
  if (newQty <= 0) {
    await shoppingStore.deleteItem(props.item.id);
  } else {
    await shoppingStore.updateItem(props.item.id, { quantity: newQty });
  }
};

const handleDelete = async () => {
  await shoppingStore.deleteItem(props.item.id);
};
</script>

<template>
  <div class="nordic-card shopping-row fade-in" :class="{ checked: item.checked }">
    <button class="checkbox-btn" @click="toggleCheck">
      <CheckSquare v-if="item.checked" :size="18" class="checked-icon" />
      <Square v-else :size="18" class="unchecked-icon" />
    </button>

    <div class="item-details" @click="toggleCheck">
      <span class="item-name" :class="{ strikethrough: item.checked }">{{ item.name }}</span>
      <div class="item-meta">
        <span class="category-chip">{{ item.category }}</span>
      </div>
    </div>

    <div class="row-actions">
      <div class="qty-controls">
        <button class="qty-btn" title="Зменшити" @click.stop="decreaseQuantity">
          <Minus :size="12" />
        </button>
        <span class="qty-text">{{ item.quantity || 1 }} <small>{{ item.unit || 'шт' }}</small></span>
        <button class="qty-btn" title="Збільшити" @click.stop="increaseQuantity">
          <Plus :size="12" />
        </button>
      </div>

      <button
        class="purchase-btn"
        title="Перемістити в холодильник (Куплено)"
        :disabled="isPurchasing"
        @click.stop="handlePurchase"
      >
        <ShoppingBag :size="14" />
        <span class="btn-text">В холодильник</span>
      </button>

      <button class="delete-btn" title="Видалити" @click.stop="handleDelete">
        <Trash2 :size="15" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.shopping-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  transition: var(--transition-fast);
}

.shopping-row.checked {
  opacity: 0.6;
  background: var(--bg-subtle);
}

.checkbox-btn {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.checkbox-btn:hover {
  color: var(--text-primary);
}

.checked-icon {
  color: var(--primary);
}

.unchecked-icon {
  color: var(--text-muted);
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}

.item-name {
  font-weight: 500;
  font-size: 0.92rem;
  color: var(--text-primary);
}

.item-name.strikethrough {
  text-decoration: line-through;
  color: var(--text-muted);
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-chip {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  color: var(--text-secondary);
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-subtle);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.qty-btn {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.qty-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.qty-text {
  font-size: 0.8rem;
  font-weight: 600;
}

.qty-text small {
  font-weight: 400;
  color: var(--text-muted);
}

.purchase-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.76rem;
  font-weight: 500;
  transition: var(--transition-fast);
}

.purchase-btn:hover {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

.delete-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.delete-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
}

@media (max-width: 640px) {
  .btn-text {
    display: none;
  }
}
</style>
