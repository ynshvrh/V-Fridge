<script setup lang="ts">
import { ChefHat } from '@lucide/vue';
</script>

<template>
  <div class="planner-page fade-in">
    <header class="page-header">
      <div>
        <h1>AI Meal Planner</h1>
        <p class="subtitle">Weekly meal suggestions based on current fridge contents</p>
      </div>
    </header>

    <div class="glass-card content-card">
      <div class="icon-header">
        <ChefHat :size="28" />
        <h2>AI Chef & Planner</h2>
      </div>
      <p class="desc">Generate tailored weekday meal plans from your available ingredients.</p>
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
