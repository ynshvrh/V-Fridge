<script setup lang="ts">
import { computed } from 'vue';
import { useRecipeParser, type ParsedRecipe, type ParsedShoppingItem } from '@/composables/useRecipeParser';
import ChefRecipeCard from './ChefRecipeCard.vue';
import ChefShoppingSuggestions from './ChefShoppingSuggestions.vue';
import { ChefHat, User } from '@lucide/vue';

export interface ChatMessageData {
  id?: number;
  role: 'user' | 'assistant' | 'model';
  content: string;
}

const props = defineProps<{
  message: ChatMessageData;
  isSavedRecipe?: boolean;
}>();

const emit = defineEmits<{
  (e: 'cook', recipe: ParsedRecipe): void;
  (e: 'save-recipe', recipe: ParsedRecipe): void;
  (e: 'add-shopping-item', item: ParsedShoppingItem): void;
  (e: 'add-all-shopping', items: ParsedShoppingItem[]): void;
}>();

const { parseChefMessage } = useRecipeParser();

const parsed = computed(() => {
  if (props.message.role === 'user') {
    return {
      dialogueText: props.message.content,
      recipe: null,
      shoppingItems: []
    };
  }
  return parseChefMessage(props.message.content);
});
</script>

<template>
  <div class="chat-message-row" :class="message.role">
    <div class="avatar-col">
      <div class="msg-avatar" :class="message.role">
        <User v-if="message.role === 'user'" :size="16" />
        <ChefHat v-else :size="16" />
      </div>
    </div>

    <div class="content-col">
      <!-- Dialogue Bubble -->
      <div v-if="parsed.dialogueText" class="msg-bubble" :class="message.role">
        <p class="bubble-text">{{ parsed.dialogueText }}</p>
      </div>

      <!-- Embedded Recipe Card -->
      <ChefRecipeCard
        v-if="parsed.recipe"
        :recipe="parsed.recipe"
        :is-saved="isSavedRecipe"
        @cook="emit('cook', $event)"
        @save="emit('save-recipe', $event)"
      />

      <!-- Embedded Missing Ingredients / Shopping Suggestions -->
      <ChefShoppingSuggestions
        v-if="parsed.shoppingItems.length > 0"
        :items="parsed.shoppingItems"
        @add-item="emit('add-shopping-item', $event)"
        @add-all="emit('add-all-shopping', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-message-row {
  display: flex;
  gap: 12px;
  max-width: 100%;
}

.chat-message-row.user {
  flex-direction: row-reverse;
}

.avatar-col {
  flex-shrink: 0;
}

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.msg-avatar.user {
  background: var(--aqua-mist-light);
  color: var(--aqua-mist-dark);
  border: 1px solid var(--aqua-mist);
}

.msg-avatar.assistant,
.msg-avatar.model {
  background: var(--light-iris-light);
  color: var(--light-iris-dark);
  border: 1px solid var(--light-iris);
}

.content-col {
  display: flex;
  flex-direction: column;
  max-width: 82%;
  gap: 8px;
}

.chat-message-row.user .content-col {
  align-items: flex-end;
}

.msg-bubble {
  padding: 11px 16px;
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
}

.msg-bubble.user {
  background: var(--june-bud-light);
  color: #2c3809;
  border: 1px solid var(--june-bud);
  border-radius: var(--radius-md);
  border-bottom-right-radius: 4px;
  font-weight: 500;
}

.msg-bubble.assistant,
.msg-bubble.model {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  border-bottom-left-radius: 4px;
  box-shadow: var(--shadow-sm);
}

.bubble-text {
  margin: 0;
  white-space: pre-wrap;
}

@media (max-width: 640px) {
  .content-col {
    max-width: 90%;
  }
}
</style>
