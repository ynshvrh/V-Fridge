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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-avatar.user {
  background: var(--bg-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.msg-avatar.assistant,
.msg-avatar.model {
  background: var(--primary);
  color: white;
}

.content-col {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.chat-message-row.user .content-col {
  align-items: flex-end;
}

.msg-bubble {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  line-height: 1.45;
  word-break: break-word;
}

.msg-bubble.user {
  background: var(--primary);
  color: white;
  border-bottom-right-radius: 2px;
}

.msg-bubble.assistant,
.msg-bubble.model {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-bottom-left-radius: 2px;
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
