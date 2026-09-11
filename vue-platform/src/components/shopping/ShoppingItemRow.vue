<script setup lang="ts">
import { ref, computed } from 'vue';
import { type ShoppingItem, useShoppingStore } from '@/stores/shopping';
import { useCurrentLanguage } from '@/composables/useCurrentLanguage';
import { formatUnit } from '@/utils/unitStandards';
import { Check, ShoppingBag, Trash2, Plus, Minus, Edit3 } from '@lucide/vue';
import EditShoppingItemModal from './EditShoppingItemModal.vue';

const props = defineProps<{
  item: ShoppingItem;
}>();

const shoppingStore = useShoppingStore();
const { currentLanguage } = useCurrentLanguage();

const isPurchasing = ref(false);
const showEditModal = ref(false);
const isSwipeEnabled = computed(() => true);

// Swipe gesture state
const swipeOffset = ref(0);
const isDragging = ref(false);
const isSwipingHorizontal = ref(false);
let startX = 0;
let startY = 0;
let hasDecidedDirection = false;
let preventClick = false;
let activePointerId: number | null = null;

const TRIGGER_THRESHOLD = 60;

const toggleCheck = async () => {
  if (preventClick) return;
  await shoppingStore.toggleCheck(props.item.id, !props.item.checked);
};

const handlePurchase = async () => {
  isPurchasing.value = true;
  await shoppingStore.purchaseItem(props.item.id);
  isPurchasing.value = false;
};

const increaseQuantity = async () => {
  const current = props.item.quantity || 1;
  const step = current < 1 ? 0.1 : 1;
  await shoppingStore.updateItem(props.item.id, { quantity: parseFloat((current + step).toFixed(3)) });
};

const decreaseQuantity = async () => {
  const current = props.item.quantity || 1;
  const step = current <= 1 ? 0.1 : 1;
  const newQty = parseFloat((current - step).toFixed(3));
  if (newQty <= 0) {
    await shoppingStore.deleteItem(props.item.id);
  } else {
    await shoppingStore.updateItem(props.item.id, { quantity: newQty });
  }
};

const handleDelete = async () => {
  await shoppingStore.deleteItem(props.item.id);
};

// Pointer Events (Touch & Mouse unified)
const handlePointerDown = (e: PointerEvent) => {
  if (!isSwipeEnabled.value) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const target = e.target as HTMLElement;
  if (target.closest('button') || target.closest('.qty-controls')) return;

  activePointerId = e.pointerId;
  startX = e.clientX;
  startY = e.clientY;
  hasDecidedDirection = false;
  isSwipingHorizontal.value = false;
  isDragging.value = false;
  preventClick = false;

  const rowEl = e.currentTarget as HTMLElement;
  if (rowEl && typeof rowEl.setPointerCapture === 'function') {
    try {
      rowEl.setPointerCapture(e.pointerId);
    } catch (_) {}
  }
};

const handlePointerMove = (e: PointerEvent) => {
  if (!isSwipeEnabled.value || activePointerId !== e.pointerId) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  if (!hasDecidedDirection) {
    if (Math.abs(dy) > 7 && Math.abs(dy) >= Math.abs(dx)) {
      hasDecidedDirection = true;
      isSwipingHorizontal.value = false;
      return;
    } else if (Math.abs(dx) > 7) {
      hasDecidedDirection = true;
      isSwipingHorizontal.value = true;
      isDragging.value = true;
      preventClick = true;
    }
  }

  if (isSwipingHorizontal.value) {
    const max = 110;
    swipeOffset.value = Math.sign(dx) * Math.min(max, Math.abs(dx) * 0.85);
  }
};

const handlePointerUp = async (e: PointerEvent) => {
  if (activePointerId !== e.pointerId) return;
  activePointerId = null;

  const rowEl = e.currentTarget as HTMLElement;
  if (rowEl && typeof rowEl.releasePointerCapture === 'function') {
    try {
      rowEl.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }

  if (isDragging.value) {
    const offset = swipeOffset.value;
    isDragging.value = false;
    swipeOffset.value = 0;
    isSwipingHorizontal.value = false;

    if (offset >= TRIGGER_THRESHOLD) {
      if (!props.item.checked) {
        await toggleCheck();
      } else {
        await handlePurchase();
      }
    } else if (offset <= -TRIGGER_THRESHOLD) {
      await handleDelete();
    }

    setTimeout(() => { preventClick = false; }, 120);
  } else {
    swipeOffset.value = 0;
    isSwipingHorizontal.value = false;
    setTimeout(() => { preventClick = false; }, 50);
  }
};

const handlePointerCancel = (e: PointerEvent) => {
  if (activePointerId !== e.pointerId) return;
  activePointerId = null;
  isDragging.value = false;
  swipeOffset.value = 0;
  isSwipingHorizontal.value = false;
  setTimeout(() => { preventClick = false; }, 50);
};

const rowStyle = computed(() => {
  if (!isSwipeEnabled.value || swipeOffset.value === 0) {
    return {
      transform: 'translateX(0px)',
      transition: isDragging.value ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
    };
  }
  return {
    transform: `translateX(${swipeOffset.value}px)`,
    transition: isDragging.value ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
  };
});
</script>

<template>
  <div class="swipe-item-container fade-in" :class="{ 'swipe-enabled': isSwipeEnabled }">
    <!-- Swipe background actions -->
    <div v-if="isSwipeEnabled" class="swipe-backgrounds">
      <div
        class="swipe-bg swipe-bg-left"
        :class="{ active: swipeOffset >= TRIGGER_THRESHOLD }"
        :style="{ opacity: swipeOffset > 0 ? Math.min(1, swipeOffset / 35) : 0 }"
      >
        <template v-if="!item.checked">
          <Check :size="16" class="action-icon" />
          <span>Куплено</span>
        </template>
        <template v-else>
          <ShoppingBag :size="16" class="action-icon" />
          <span>В холодильник</span>
        </template>
      </div>

      <div
        class="swipe-bg swipe-bg-right"
        :class="{ active: swipeOffset <= -TRIGGER_THRESHOLD }"
        :style="{ opacity: swipeOffset < 0 ? Math.min(1, Math.abs(swipeOffset) / 35) : 0 }"
      >
        <Trash2 :size="16" class="action-icon" />
        <span>Видалити</span>
      </div>
    </div>

    <!-- Main item card -->
    <div
      class="nordic-card shopping-row"
      :class="{ checked: item.checked, swiping: isDragging }"
      :style="rowStyle"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerCancel"
    >
      <button
        type="button"
        class="check-circle-btn"
        :class="{ checked: item.checked }"
        :title="item.checked ? 'Позначити як не куплено' : 'Позначити як куплено'"
        @click.stop="toggleCheck"
      >
        <Check v-if="item.checked" :size="12" class="check-icon" />
      </button>

      <div class="item-details clickable-details" title="Натисніть для редагування" @click.stop="showEditModal = true">
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
          <span class="qty-text">{{ item.quantity || 1 }} <small>{{ formatUnit(item.unit, currentLanguage) }}</small></span>
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

        <button
          class="action-icon-btn edit-btn"
          title="Редагувати"
          @click.stop="showEditModal = true"
        >
          <Edit3 :size="14" />
        </button>

        <button
          class="action-icon-btn delete-btn"
          title="Видалити"
          @click.stop="handleDelete"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <!-- Edit Shopping Item Modal -->
    <EditShoppingItemModal
      v-if="showEditModal"
      :item="item"
      @close="showEditModal = false"
    />
  </div>
</template>

<style scoped>
.swipe-item-container {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.swipe-backgrounds {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.swipe-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background 0.15s ease, transform 0.15s ease;
}

.swipe-bg-left {
  left: 0;
  right: 50%;
  justify-content: flex-start;
  color: var(--status-fresh);
  background: rgba(16, 185, 129, 0.12);
  border-top-left-radius: var(--radius-md);
  border-bottom-left-radius: var(--radius-md);
}

.swipe-bg-left.active {
  background: rgba(16, 185, 129, 0.24);
  font-weight: 700;
}

.swipe-bg-right {
  left: 50%;
  right: 0;
  justify-content: flex-end;
  color: var(--status-expired);
  background: rgba(239, 68, 68, 0.12);
  border-top-right-radius: var(--radius-md);
  border-bottom-right-radius: var(--radius-md);
}

.swipe-bg-right.active {
  background: rgba(239, 68, 68, 0.24);
  font-weight: 700;
}

.action-icon {
  transition: transform 0.15s ease;
}

.swipe-bg.active .action-icon {
  transform: scale(1.2);
}

.swipe-enabled .shopping-row {
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.shopping-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  touch-action: pan-y;
  background: var(--bg-card);
}

.shopping-row.checked {
  opacity: 0.6;
  background: var(--bg-subtle);
}

.shopping-row.swiping {
  cursor: grabbing;
  user-select: none;
  -webkit-user-select: none;
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

.check-circle-btn {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--border-strong);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  color: #ffffff;
  transition: var(--transition-fast);
  flex-shrink: 0;
}

.check-circle-btn:hover {
  border-color: var(--primary);
  background: var(--primary-subtle);
}

.check-circle-btn.checked {
  background: var(--mint-bloom-dark);
  border-color: var(--mint-bloom-dark);
}

.clickable-details {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--radius-xs);
  transition: background-color 0.15s ease;
}

.clickable-details:hover {
  background: var(--bg-hover);
}

.action-icon-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 5px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.action-icon-btn.edit-btn:hover {
  color: var(--primary);
  background: var(--primary-subtle);
}

.action-icon-btn.delete-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
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
