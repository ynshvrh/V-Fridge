<script setup lang="ts">
import type { ParsedRecipe } from '@/composables/useRecipeParser';
import CookRecipeModal from '@/components/fridge/CookRecipeModal.vue';

defineProps<{
  recipe: ParsedRecipe;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'cooked'): void;
}>();
</script>

<template>
  <CookRecipeModal
    :recipe="recipe"
    @close="emit('close')"
    @cooked="emit('cooked')"
  />
</template>
