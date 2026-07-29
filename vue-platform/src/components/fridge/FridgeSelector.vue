<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useFridgeStore } from '@/stores/fridge';
import { useProductStore } from '@/stores/product';
import { Refrigerator, ChevronDown, Plus, Users, Check } from '@lucide/vue';

const fridgeStore = useFridgeStore();
const productStore = useProductStore();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const emit = defineEmits<{
  (e: 'open-create-modal'): void;
}>();

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectFridge = async (id: number) => {
  fridgeStore.setActiveFridge(id);
  isOpen.value = false;
  await productStore.fetchProducts();
};

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="fridge-selector" ref="dropdownRef">
    <button class="selector-btn" @click="toggleDropdown">
      <div class="active-badge">
        <Refrigerator :size="16" />
      </div>
      <span class="active-name">{{ fridgeStore.activeFridge?.name || 'Select Fridge' }}</span>
      <ChevronDown :size="16" class="chevron" :class="{ open: isOpen }" />
    </button>

    <div v-if="isOpen" class="dropdown-menu glass-card fade-in">
      <div class="dropdown-header">Your Fridges</div>
      <div class="menu-items">
        <button
          v-for="f in fridgeStore.fridges"
          :key="f.id"
          class="menu-item"
          :class="{ active: f.id === fridgeStore.activeFridgeId }"
          @click="selectFridge(f.id)"
        >
          <div class="item-info">
            <span class="item-name">{{ f.name }}</span>
            <span class="item-meta">
              <Users :size="12" /> {{ f.memberCount }} member{{ f.memberCount > 1 ? 's' : '' }}
            </span>
          </div>
          <Check v-if="f.id === fridgeStore.activeFridgeId" :size="16" class="check-icon" />
        </button>
      </div>

      <div class="dropdown-divider"></div>

      <button class="menu-item create-item" @click="isOpen = false; emit('open-create-modal')">
        <Plus :size="16" />
        <span>Create New Fridge</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.fridge-selector {
  position: relative;
  display: inline-block;
}

.selector-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  padding: 6px 14px 6px 8px;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-weight: 500;
  transition: var(--transition-fast);
}

.selector-btn:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: var(--border-strong);
}

.active-badge {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
  display: flex;
  align-items: center;
  justify-content: center;
}

.active-name {
  font-size: 0.9rem;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron {
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 220px;
  padding: 8px;
  z-index: 150;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

.dropdown-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 10px;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
  transition: var(--transition-fast);
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.menu-item.active {
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
}

.item-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.item-name {
  font-weight: 500;
}

.item-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.check-icon {
  color: var(--accent-orange);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 6px 0;
}

.create-item {
  color: var(--accent-orange);
  justify-content: flex-start;
  gap: 8px;
  font-weight: 600;
}
</style>
