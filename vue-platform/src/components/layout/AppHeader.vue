<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useFridgeStore } from '@/stores/fridge';
import { useAuthStore } from '@/stores/auth';
import { Menu, Refrigerator } from '@lucide/vue';

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void;
}>();

const route = useRoute();
const fridgeStore = useFridgeStore();
const authStore = useAuthStore();

const pageTitle = computed(() => {
  switch (route.name) {
    case 'Dashboard':
      return 'Мій холодильник';
    case 'Shopping':
      return 'Список покупок';
    case 'Planner':
      return 'Планувальник меню';
    case 'Recipes':
      return 'Шеф-кухар AI';
    case 'Nutrition':
      return 'Калорії та БЖУ';
    case 'Analytics':
      return 'Аналітика продуктів';
    case 'Fridges':
      return 'Спільні холодильники';
    case 'Settings':
      return 'Налаштування';
    default:
      return 'V-Fridge';
  }
});
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <button
          v-if="authStore.isAuthenticated"
          class="mobile-menu-trigger"
          title="Меню"
          @click="emit('toggle-sidebar')"
        >
          <Menu :size="20" />
        </button>

        <div class="mobile-brand">
          <div class="brand-mini-icon">
            <Refrigerator :size="15" />
          </div>
          <span class="brand-mini-title">V-Fridge</span>
        </div>

        <h1 class="desktop-title">{{ pageTitle }}</h1>
      </div>

      <div class="header-right">
        <div v-if="authStore.isAuthenticated && fridgeStore.activeFridge" class="active-fridge-pill">
          <Refrigerator :size="14" class="pill-icon" />
          <span class="pill-name">{{ fridgeStore.activeFridge.name }}</span>
          <span v-if="fridgeStore.activeFridge.role" class="pill-role">{{ fridgeStore.activeFridge.role }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 56px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-menu-trigger {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  background: var(--bg-subtle);
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 8px;
}

.brand-mini-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-mini-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.desktop-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

@media (max-width: 900px) {
  .mobile-menu-trigger {
    display: flex;
  }
  .mobile-brand {
    display: flex;
  }
  .desktop-title {
    display: none;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.active-fridge-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.pill-icon {
  color: var(--text-primary);
}

.pill-name {
  font-weight: 600;
  color: var(--text-primary);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pill-role {
  text-transform: uppercase;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--border-subtle);
  color: var(--text-muted);
}
</style>
