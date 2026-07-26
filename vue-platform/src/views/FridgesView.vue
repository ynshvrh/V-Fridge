<script setup lang="ts">
import { Users } from '@lucide/vue';
</script>

<template>
  <div class="fridges-page fade-in">
    <header class="page-header">
      <div>
        <h1>Fridges & Shared Access</h1>
        <p class="subtitle">Manage owned fridges and member invitations</p>
      </div>
    </header>

    <div class="glass-card content-card">
      <div class="icon-header">
        <Users :size="28" />
        <h2>Shared Fridges</h2>
      </div>
      <p class="desc">Invite family members or housemates to collaborate on food inventory in real-time.</p>
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
