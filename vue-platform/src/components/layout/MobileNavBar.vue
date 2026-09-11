<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useShoppingStore } from '@/stores/shopping';
import { Refrigerator, ShoppingBag, Sparkles, CalendarDays, Flame } from '@lucide/vue';

const route = useRoute();
const shoppingStore = useShoppingStore();

const unboughtCount = computed(() => {
  return shoppingStore.uncheckedItems.length;
});

const navItems = [
  { name: 'Dashboard', path: '/', label: 'Холодильник', icon: Refrigerator },
  { name: 'Shopping', path: '/shopping', label: 'Покупки', icon: ShoppingBag, badge: unboughtCount },
  { name: 'Recipes', path: '/recipes', label: 'ШІ-Шеф', icon: Sparkles },
  { name: 'Planner', path: '/planner', label: 'Планер', icon: CalendarDays },
  { name: 'Nutrition', path: '/nutrition', label: 'КБЖВ', icon: Flame },
];

const isActive = (item: { name: string; path: string }) => {
  if (item.name === 'Dashboard') {
    return route.path === '/' || route.path === '/fridge';
  }
  return route.path.startsWith(item.path);
};
</script>

<template>
  <nav class="mobile-nav-bar" aria-label="Mobile Navigation">
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="item.path"
      class="nav-tab"
      :class="{ 'is-active': isActive(item) }"
    >
      <div class="icon-wrapper">
        <component :is="item.icon" :size="20" class="nav-icon" />
        <span v-if="item.badge && item.badge.value > 0" class="tab-badge">
          {{ item.badge.value > 99 ? '99+' : item.badge.value }}
        </span>
      </div>
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.mobile-nav-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: calc(60px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--border-subtle);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.04);
}

@media (max-width: 767px) {
  .mobile-nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 100%;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  touch-action: manipulation;
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 28px;
  border-radius: var(--radius-full);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-icon {
  transition: transform 0.2s ease;
}

.nav-label {
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  transition: color 0.2s ease;
}

.nav-tab:hover {
  color: var(--text-primary);
}

.nav-tab.is-active {
  color: var(--primary);
}

.nav-tab.is-active .icon-wrapper {
  background: var(--primary-subtle);
  transform: translateY(-2px);
}

.nav-tab.is-active .nav-icon {
  color: var(--primary);
}

.nav-tab.is-active .nav-label {
  font-weight: 700;
  color: var(--primary);
}

.tab-badge {
  position: absolute;
  top: -2px;
  right: -4px;
  background: var(--lotus-pink-dark);
  color: #ffffff;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 15px;
  height: 15px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 1.5px solid var(--bg-surface);
}
</style>
