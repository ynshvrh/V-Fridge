<script setup lang="ts">
import { ShoppingCart } from '@lucide/vue';
</script>

<template>
  <div class="shopping-page fade-in">
    <header class="page-header">
      <div>
        <h1>Shopping List</h1>
        <p class="subtitle">Track items to buy and convert them to products upon purchase</p>
      </div>
    </header>

    <div class="glass-card content-card">
      <div class="icon-header">
        <ShoppingCart :size="28" />
        <h2>Shopping List</h2>
      </div>
      <p class="desc">Keep track of groceries to buy. Marked items are automatically synced to inventory.</p>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 24px;
}
.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}
.content-card {
  padding: 32px;
}
.icon-header {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--accent-purple-hover);
  margin-bottom: 12px;
}
.desc {
  color: var(--text-secondary);
}
</style>
