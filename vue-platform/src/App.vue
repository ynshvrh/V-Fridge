<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
</script>

<template>
  <div class="app-shell">
    <Navbar />
    <main class="main-content">
      <router-view />
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 12px;
}

@media (max-width: 768px) {
  .main-content {
    padding-bottom: 80px; /* Account for fixed BottomNav */
  }
}

@media (min-width: 640px) {
  .main-content {
    padding: 18px;
  }
}

@media (min-width: 1024px) {
  .main-content {
    padding: 24px;
  }
}
</style>
