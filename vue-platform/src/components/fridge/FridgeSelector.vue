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
        <Refrigerator :size="15" />
      </div>
      <span class="active-name">{{ fridgeStore.activeFridge?.name || 'Виберіть холодильник' }}</span>
      <ChevronDown :size="14" class="chevron" :class="{ open: isOpen }" />
    </button>

    <div v-if="isOpen" class="dropdown-menu glass-card fade-in">
      <div class="dropdown-header">Ваші холодильники</div>
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
              <Users :size="11" /> {{ f.memberCount }} учасник{{ f.memberCount > 1 ? 'ів' : '' }}
            </span>
          </div>
          <Check v-if="f.id === fridgeStore.activeFridgeId" :size="15" class="check-icon" />
        </button>
      </div>

      <div class="dropdown-divider"></div>

      <button class="menu-item create-item" @click="isOpen = false; emit('open-create-modal')">
        <Plus :size="15" />
        <span>Створити холодильник</span>
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
  gap: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 5px 12px 5px 7px;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-weight: 500;
  transition: var(--transition-fast);
}

.selector-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}

.active-badge {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.active-name {
  font-size: 0.84rem;
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
  top: calc(100% + 6px);
  left: 0;
  min-width: 220px;
  padding: 6px;
  z-index: 250;
  box-shadow: var(--shadow-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.dropdown-header {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 8px;
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
  padding: 6px 8px;
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
  font-size: 0.82rem;
  transition: var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
}

.menu-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.menu-item.active {
  background: var(--primary-subtle);
  color: var(--text-primary);
  font-weight: 600;
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
  font-size: 0.7rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.check-icon {
  color: var(--primary);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 4px 0;
}

.create-item {
  color: var(--primary);
  justify-content: flex-start;
  gap: 6px;
  font-weight: 600;
}
</style>
