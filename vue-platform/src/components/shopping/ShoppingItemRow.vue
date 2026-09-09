<script setup lang="ts">
import { ref, computed } from 'vue';
import { type ShoppingItem, useShoppingStore } from '@/stores/shopping';
import { useThemeStore } from '@/stores/theme';
import { useCurrentLanguage } from '@/composables/useCurrentLanguage';
import { formatUnit } from '@/utils/unitStandards';
import { Check, ShoppingBag, Trash2, Plus, Minus } from '@lucide/vue';

const props = defineProps<{
  item: ShoppingItem;
}>();

const shoppingStore = useShoppingStore();
const themeStore = useThemeStore();
const { currentLanguage } = useCurrentLanguage();

const isPurchasing = ref(false);
const isSwipeEnabled = computed(() => themeStore.shoppingMode === 'swipe');

// Swipe gesture state
const swipeOffset = ref(0);
const isDragging = ref(false);
const isSwipingHorizontal = ref(false);
let startX = 0;
let startY = 0;
let hasDecidedDirection = false;
let preventClick = false;

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

// Touch gestures
const handleTouchStart = (e: TouchEvent) => {
  if (!isSwipeEnabled.value || e.touches.length !== 1) return;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  hasDecidedDirection = false;
  isSwipingHorizontal.value = false;
  isDragging.value = false;
  preventClick = false;
};

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwipeEnabled.value || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - startX;
  const dy = e.touches[0].clientY - startY;

  if (!hasDecidedDirection) {
    if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
      hasDecidedDirection = true;
      isSwipingHorizontal.value = false;
      return;
    } else if (Math.abs(dx) > 8) {
      hasDecidedDirection = true;
      isSwipingHorizontal.value = true;
      isDragging.value = true;
      preventClick = true;
    }
  }

  if (isSwipingHorizontal.value) {
    if (e.cancelable) e.preventDefault();
    const max = 110;
    swipeOffset.value = Math.sign(dx) * Math.min(max, Math.abs(dx) * 0.85);
  }
};

const handleTouchEnd = async () => {
  if (!isSwipeEnabled.value || !isSwipingHorizontal.value) {
    isDragging.value = false;
    swipeOffset.value = 0;
    setTimeout(() => { preventClick = false; }, 50);
    return;
  }

  const offset = swipeOffset.value;
  isDragging.value = false;
  swipeOffset.value = 0;
  isSwipingHorizontal.value = false;
  hasDecidedDirection = false;

  if (offset >= TRIGGER_THRESHOLD) {
    if (!props.item.checked) {
      await toggleCheck();
    } else {
      await handlePurchase();
    }
  } else if (offset <= -TRIGGER_THRESHOLD) {
    await handleDelete();
  }

  setTimeout(() => { preventClick = false; }, 100);
};

// Mouse drag support for desktop testing
let mouseStartX = 0;
let mouseStartY = 0;
let isMouseDown = false;

const handleMouseDown = (e: MouseEvent) => {
  if (!isSwipeEnabled.value || e.button !== 0) return;
  const target = e.target as HTMLElement;
  if (target.closest('button') || target.closest('.qty-controls')) return;

  isMouseDown = true;
  mouseStartX = e.clientX;
  mouseStartY = e.clientY;
  preventClick = false;

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};

const onMouseMove = (e: MouseEvent) => {
  if (!isMouseDown) return;
  const dx = e.clientX - mouseStartX;
  const dy = e.clientY - mouseStartY;

  if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
    isDragging.value = true;
    preventClick = true;
    const max = 110;
    swipeOffset.value = Math.sign(dx) * Math.min(max, Math.abs(dx) * 0.85);
  }
};

const onMouseUp = async () => {
  if (!isMouseDown) return;
  isMouseDown = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);

  if (isDragging.value) {
    const offset = swipeOffset.value;
    isDragging.value = false;
    swipeOffset.value = 0;

    if (offset >= TRIGGER_THRESHOLD) {
      if (!props.item.checked) {
        await toggleCheck();
      } else {
        await handlePurchase();
      }
    } else if (offset <= -TRIGGER_THRESHOLD) {
      await handleDelete();
    }

    setTimeout(() => { preventClick = false; }, 100);
  }
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
  <div class="swipe-item-container" :class="{ 'swipe-enabled': isSwipeEnabled }">
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
      class="nordic-card shopping-row fade-in"
      :class="{ checked: item.checked, swiping: isDragging }"
      :style="rowStyle"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
      @mousedown="handleMouseDown"
    >
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
          <span class="qty-text">{{ item.quantity || 1 }} <small>{{ formatUnit(item.unit, currentLanguage) }}</small></span>
          <button class="qty-btn" title="Збільшити" @click.stop="increaseQuantity">
            <Plus :size="12" />
          </button>
        </div>

        <button
          v-if="!isSwipeEnabled || item.checked"
          class="purchase-btn"
          title="Перемістити в холодильник (Куплено)"
          :disabled="isPurchasing"
          @click.stop="handlePurchase"
        >
          <ShoppingBag :size="14" />
          <span class="btn-text">В холодильник</span>
        </button>

        <button
          v-if="!isSwipeEnabled"
          class="delete-btn"
          title="Видалити"
          @click.stop="handleDelete"
        >
          <Trash2 :size="15" />
        </button>
      </div>
    </div>
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
