<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useChefChat } from '@/composables/useChefChat';
import type { ParsedRecipe, ParsedShoppingItem } from '@/composables/useRecipeParser';
import { useSavedRecipeStore } from '@/stores/savedRecipes';
import { useShoppingStore } from '@/stores/shopping';
import ChefPromptSuggestions from './ChefPromptSuggestions.vue';
import ChefChatMessage from './ChefChatMessage.vue';
import ChefCookModal from './ChefCookModal.vue';
import { ChefHat, Send, Trash2, Loader2, Sparkles } from '@lucide/vue';

const {
  messages,
  input,
  loading,
  activeMode,
  fetchHistory,
  sendMessage,
  clearHistory
} = useChefChat();

const savedRecipeStore = useSavedRecipeStore();
const shoppingStore = useShoppingStore();

const scrollContainerRef = ref<HTMLDivElement | null>(null);
const cookingRecipe = ref<ParsedRecipe | null>(null);

const scrollToBottom = async () => {
  await nextTick();
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = scrollContainerRef.value.scrollHeight;
  }
};

onMounted(async () => {
  await fetchHistory();
  await scrollToBottom();
});

watch(() => messages.value.length, () => {
  scrollToBottom();
});

const handleSend = async (customPrompt?: string) => {
  const ok = await sendMessage(customPrompt);
  if (ok) {
    await scrollToBottom();
  }
};

const handleSaveRecipe = async (recipe: ParsedRecipe) => {
  await savedRecipeStore.saveRecipe({
    name: recipe.name,
    description: recipe.description,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    calories: recipe.calories,
    protein: recipe.protein,
    fat: recipe.fat,
    carbs: recipe.carbs
  });
};

const handleAddShoppingItem = async (item: ParsedShoppingItem) => {
  await shoppingStore.addItem({
    name: item.name,
    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
    unit: item.unit || 'шт',
    category: item.category || 'other'
  });
};

const handleAddAllShopping = async (items: ParsedShoppingItem[]) => {
  for (const item of items) {
    await handleAddShoppingItem(item);
  }
};

const handleClear = async () => {
  if (confirm('Очистити всю історію листування з Шефом?')) {
    await clearHistory();
  }
};
</script>

<template>
  <div class="chef-chat-container">
    <!-- Chat Header -->
    <header class="chat-header">
      <div class="header-titles">
        <div class="title-row">
          <ChefHat :size="22" class="chef-icon" />
          <h2 class="chat-title">Шеф-кухар V-Fridge</h2>
        </div>
        <p class="chat-subtitle">
          Персональний AI-шеф, що створює страви з продуктів у вашому холодильнику
        </p>
      </div>

      <div class="header-actions">
        <button
          v-if="messages.length > 0"
          type="button"
          class="btn-destructive btn-sm"
          :disabled="loading"
          @click="handleClear"
        >
          <Trash2 :size="14" />
          <span>Очистити</span>
        </button>
      </div>
    </header>

    <!-- Message Stream -->
    <div ref="scrollContainerRef" class="chat-messages-area">
      <!-- Empty State -->
      <div v-if="messages.length === 0 && !loading" class="chat-empty-state fade-in">
        <div class="empty-icon-circle">
          <Sparkles :size="28" class="sparkle-icon" />
        </div>
        <h3>Шеф готовий готувати!</h3>
        <p>
          Оберіть швидку підказку нижче або запитайте, яку страву приготувати з наявних інгредієнтів.
        </p>
      </div>

      <!-- Messages List -->
      <div v-else class="messages-list">
        <ChefChatMessage
          v-for="(msg, idx) in messages"
          :key="msg.id || idx"
          :message="msg"
          @cook="cookingRecipe = $event"
          @save-recipe="handleSaveRecipe"
          @add-shopping-item="handleAddShoppingItem"
          @add-all-shopping="handleAddAllShopping"
        />

        <!-- Typing Loader -->
        <div v-if="loading" class="typing-indicator fade-in">
          <div class="msg-avatar assistant">
            <ChefHat :size="16" />
          </div>
          <div class="typing-bubble">
            <Loader2 :size="16" class="spin" />
            <span>Шеф підбирає ідеальний рецепт...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestions & Input Bar -->
    <footer class="chat-footer">
      <ChefPromptSuggestions
        :active-mode="activeMode"
        :disabled="loading"
        @select-mode="activeMode = $event"
        @send-prompt="handleSend($event)"
      />

      <form @submit.prevent="handleSend()" class="input-row">
        <input
          v-model="input"
          type="text"
          class="chat-input"
          placeholder="Запитайте шефа що приготувати..."
          :disabled="loading"
        />
        <button
          type="submit"
          class="btn-primary btn-send"
          :disabled="loading || !input.trim()"
        >
          <Loader2 v-if="loading" :size="16" class="spin" />
          <Send v-else :size="16" />
        </button>
      </form>
    </footer>

    <!-- Cook Modal -->
    <ChefCookModal
      v-if="cookingRecipe"
      :recipe="cookingRecipe"
      @close="cookingRecipe = null"
      @cooked="cookingRecipe = null"
    />
  </div>
</template>

<style scoped>
.chef-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 920px;
  margin: 0 auto;
  width: 100%;
  gap: 12px;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chef-icon {
  color: var(--primary);
}

.chat-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.chat-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.chat-messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  min-height: 380px;
}

.chat-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto;
  text-align: center;
  padding: 32px 16px;
  max-width: 420px;
}

.empty-icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-subtle, rgba(224, 90, 71, 0.12));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.sparkle-icon {
  color: var(--primary);
}

.chat-empty-state h3 {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.chat-empty-state p {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  font-size: 0.84rem;
  color: var(--text-secondary);
}

.chat-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-surface);
  padding: 12px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.input-row {
  display: flex;
  gap: 8px;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.88rem;
  outline: none;
  transition: var(--transition-fast);
}

.chat-input:focus {
  border-color: var(--primary);
  background: var(--bg-surface);
}

.btn-send {
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
