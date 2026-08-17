<script setup lang="ts">
import ChefChat from '@/components/chat/ChefChat.vue';
</script>

<template>
  <div class="recipes-view fade-in">
    <ChefChat />
  </div>
</template>

<style scoped>
.recipes-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
