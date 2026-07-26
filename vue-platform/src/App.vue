<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue';
</script>

<template>
  <div class="app-shell">
    <Navbar />
    <main class="main-content">
      <router-view />
    </main>
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
  padding: 24px;
}
</style>
