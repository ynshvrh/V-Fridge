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
import { useAnalyticsStore } from '@/stores/analytics';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppHeader from '@/components/layout/AppHeader.vue';

const authStore = useAuthStore();
const fridgeStore = useFridgeStore();
const productStore = useProductStore();
const shoppingStore = useShoppingStore();
const plannerStore = usePlannerStore();
const nutritionStore = useNutritionStore();
const savedRecipesStore = useSavedRecipeStore();
const analyticsStore = useAnalyticsStore();
const route = useRoute();

const isMobileSidebarOpen = ref(false);
let lastFocusCheck = Date.now();

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
  } else if (route.name === 'Analytics') {
    await analyticsStore.fetchAnalytics(true);
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
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('focus', handleVisibilityOrFocus);
});
</script>

<template>
  <div v-if="authStore.isAuthenticated" class="app-layout">
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
}

.app-content-inset {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

@media (max-width: 768px) {
  .app-content-inset {
    padding: 16px 12px 24px;
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
