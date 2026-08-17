<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppHeader from '@/components/layout/AppHeader.vue';

const authStore = useAuthStore();
const isMobileSidebarOpen = ref(false);
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
