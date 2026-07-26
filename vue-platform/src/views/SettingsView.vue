<script setup lang="ts">
import { Settings } from '@lucide/vue';
</script>

<template>
  <div class="settings-page fade-in">
    <header class="page-header">
      <div>
        <h1>Settings & Profile</h1>
        <p class="subtitle">Customize preferences, avatar, and account credentials</p>
      </div>
    </header>

    <div class="glass-card content-card">
      <div class="icon-header">
        <Settings :size="28" />
        <h2>Account Settings</h2>
      </div>
      <p class="desc">Manage user preferences, preferred language, cuisine options, and security.</p>
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
