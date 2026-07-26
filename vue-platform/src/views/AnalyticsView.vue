<script setup lang="ts">
import { BarChart3 } from '@lucide/vue';
</script>

<template>
  <div class="analytics-page fade-in">
    <header class="page-header">
      <div>
        <h1>Consumption Analytics</h1>
        <p class="subtitle">Insights into food waste, top consumed items, and weekly trends</p>
      </div>
    </header>

    <div class="glass-card content-card">
      <div class="icon-header">
        <BarChart3 :size="28" />
        <h2>Dashboard Analytics</h2>
      </div>
      <p class="desc">Track waste statistics and optimization trends for your active fridge.</p>
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
