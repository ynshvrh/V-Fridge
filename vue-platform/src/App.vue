<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useFridgeStore } from '@/stores/fridge';
import { useProductStore } from '@/stores/product';
import { useShoppingStore } from '@/stores/shopping';
import { usePlannerStore } from '@/stores/planner';
import { useNutritionStore } from '@/stores/nutrition';
import { useSavedRecipeStore } from '@/stores/savedRecipes';
import { eventBus } from '@/utils/eventBus';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import MobileNavBar from '@/components/layout/MobileNavBar.vue';
import AppSplashLoader from '@/components/layout/AppSplashLoader.vue';

const authStore = useAuthStore();
const fridgeStore = useFridgeStore();
const productStore = useProductStore();
const shoppingStore = useShoppingStore();
const plannerStore = usePlannerStore();
const nutritionStore = useNutritionStore();
const savedRecipesStore = useSavedRecipeStore();
const route = useRoute();

const isMobileSidebarOpen = ref(false);
let lastFocusCheck = Date.now();
const unsubs: Array<() => void> = [];

const handleVisibilityOrFocus = async () => {
  if (!authStore.isAuthenticated) return;
  const now = Date.now();
  // Throttle background revalidation to at most once every 12 seconds
  if (now - lastFocusCheck < 12000) return;
  lastFocusCheck = now;

  // Background silent sync
  await fridgeStore.fetchFridges(true);

  if (route.name === 'Dashboard') {
    await productStore.fetchProducts(true);
  } else if (route.name === 'Shopping') {
    await shoppingStore.fetchShoppingItems(true);
  } else if (route.name === 'Planner') {
    await plannerStore.fetchPlan(true);
  } else if (route.name === 'Nutrition') {
    const today = new Date().toISOString().split('T')[0];
    await nutritionStore.fetchDailyData(today, true);
  } else if (route.name === 'SavedRecipes') {
    await savedRecipesStore.fetchSavedRecipes(true);
  }
};

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    handleVisibilityOrFocus();
  }
};

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', handleVisibilityOrFocus);

  unsubs.push(
    eventBus.on('fridge:changed', async () => {
      await fridgeStore.fetchFridges(true);
      if (route.name === 'Dashboard') {
        await productStore.fetchProducts(true);
      }
    }),
    eventBus.on('shopping:changed', async () => {
      await shoppingStore.fetchShoppingItems(true);
      await fridgeStore.fetchFridges(true);
      if (route.name === 'Dashboard') {
        await productStore.fetchProducts(true);
      }
    }),
    eventBus.on('nutrition:changed', async () => {
      if (route.name === 'Nutrition') {
        const today = new Date().toISOString().split('T')[0];
        await nutritionStore.fetchDailyData(today, true);
      }
    }),
    eventBus.on('planner:changed', async () => {
      if (route.name === 'Planner') {
        await plannerStore.fetchPlan(true);
      }
    })
  );
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('focus', handleVisibilityOrFocus);
  unsubs.forEach((u) => u());
});
</script>

<template>
  <AppSplashLoader v-if="authStore.isInitializing" />

  <div v-else-if="authStore.isAuthenticated" class="app-layout">
    <AppSidebar
      :is-mobile-open="isMobileSidebarOpen"
      @close-mobile="isMobileSidebarOpen = false"
    />
    <div class="app-main-column">
      <AppHeader @toggle-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen" />
      <main class="app-content-inset">
        <div class="page-container">
          <router-view />
        </div>
      </main>
      <MobileNavBar />
    </div>
  </div>

  <div v-else class="app-auth-layout">
    <router-view />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-base);
}

.app-main-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.app-content-inset {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

@media (max-width: 768px) {
  .app-content-inset {
    padding: 14px 12px calc(76px + env(safe-area-inset-bottom, 0px));
  }
}

.page-container {
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.app-auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  padding: 16px;
}
</style>
