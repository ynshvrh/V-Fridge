<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { api } from '@/api/client';
import { useSavedRecipeStore } from '@/stores/savedRecipes';
import { useProductStore } from '@/stores/product';
import { 
  ChefHat, 
  Sparkles, 
  Send, 
  Trash2, 
  User, 
  Bookmark, 
  Loader2 
} from '@lucide/vue';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export interface ParsedRecipeBlock {
  preText: string;
  recipeName: string;
  recipeDescription: string;
  ingredients: string[];
  steps: string[];
  postText: string;
  hasRecipe: boolean;
}

const savedRecipeStore = useSavedRecipeStore();
const productStore = useProductStore();

const messages = ref<ChatMessage[]>([]);
const input = ref('');
const loading = ref(false);
const scrollContainerRef = ref<HTMLDivElement | null>(null);

const extractRecipeData = (content: string): ParsedRecipeBlock => {
  const codeBlockMatch = content.match(/```(?:recipe)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    const rawBlock = codeBlockMatch[1];
    const preText = content.slice(0, codeBlockMatch.index).trim();
    const postText = content.slice(codeBlockMatch.index! + codeBlockMatch[0].length).trim();

    let name = 'Рецепт від AI Шефа';
    let description = '';
    const ingredients: string[] = [];
    const steps: string[] = [];

    const lines = rawBlock.split('\n').map((l) => l.trim()).filter(Boolean);
    let section: 'none' | 'ingredients' | 'steps' = 'none';

    for (const line of lines) {
      if (/^(?:Title|Name|Назва|Рецепт):/i.test(line)) {
        name = line.replace(/^(?:Title|Name|Назва|Рецепт):\s*/i, '').replace(/[*#]/g, '').trim();
      } else if (/^(?:Description|Опис):/i.test(line)) {
        description = line.replace(/^(?:Description|Опис):\s*/i, '').trim();
      } else if (/^(?:Ingredients|Інгредієнти):/i.test(line)) {
        section = 'ingredients';
      } else if (/^(?:Steps|Кроки|Приготування):/i.test(line)) {
        section = 'steps';
      } else if (line.startsWith('-') || line.startsWith('*')) {
        const item = line.replace(/^[-*]\s*/, '').trim();
        if (section === 'steps') steps.push(item);
        else ingredients.push(item);
      } else if (/^\d+\./.test(line)) {
        steps.push(line.replace(/^\d+\.\s*/, '').trim());
      } else {
        if (section === 'ingredients') ingredients.push(line);
        else if (section === 'steps') steps.push(line);
        else if (!description) description = line;
      }
    }

    return {
      preText,
      recipeName: name,
      recipeDescription: description,
      ingredients,
      steps,
      postText,
      hasRecipe: true
    };
  }

  const ingIndex = content.search(/(?:Інгредієнти|Ingredients):/i);
  if (ingIndex !== -1) {
    const preText = content.slice(0, ingIndex).trim();
    const recipeText = content.slice(ingIndex).trim();

    let name = 'Рецепт від AI Шефа';
    const titleMatch = preText.match(/\*\*(.*?)\*\*/) || preText.match(/^#+\s*(.*)/m);
    if (titleMatch) {
      name = titleMatch[1].replace(/[*#]/g, '').trim();
    }

    const ingredients: string[] = [];
    const steps: string[] = [];
    const lines = recipeText.split('\n').map((l) => l.trim()).filter(Boolean);
    let section: 'ingredients' | 'steps' = 'ingredients';

    for (const line of lines) {
      if (/(?:Кроки|Приготування|Steps):/i.test(line)) {
        section = 'steps';
        continue;
      }
      if (/(?:Інгредієнти|Ingredients):/i.test(line)) {
        section = 'ingredients';
        continue;
      }
      if (line.startsWith('-') || line.startsWith('*')) {
        const item = line.replace(/^[-*]\s*/, '').trim();
        if (section === 'steps') steps.push(item);
        else ingredients.push(item);
      } else if (/^\d+\./.test(line)) {
        steps.push(line.replace(/^\d+\.\s*/, '').trim());
      }
    }

    return {
      preText,
      recipeName: name,
      recipeDescription: '',
      ingredients,
      steps,
      postText: '',
      hasRecipe: true
    };
  }

  return {
    preText: content,
    recipeName: '',
    recipeDescription: '',
    ingredients: [],
    steps: [],
    postText: '',
    hasRecipe: false
  };
};

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollContainerRef.value) {
      scrollContainerRef.value.scrollTop = scrollContainerRef.value.scrollHeight;
    }
  });
};

onMounted(async () => {
  try {
    const data = await api.fetch<ChatMessage[]>('/chat');
    if (Array.isArray(data)) {
      messages.value = data.slice(-20);
    }
  } catch (err) {
    console.error('Failed to load chat history:', err);
  }
  scrollToBottom();
});

const sendMessage = async (text: string) => {
  if (!text.trim() || loading.value) return;

  const userMsg = text.trim();
  input.value = '';
  messages.value.push({ role: 'user', content: userMsg });
  loading.value = true;
  scrollToBottom();

  try {
    const reply = await api.fetch<ChatMessage>('/chat', {
      method: 'POST',
      body: JSON.stringify({ content: userMsg })
    });
    messages.value.push(reply);
  } catch (err: any) {
    alert(err.error || err.message || 'Не вдалося надіслати повідомлення AI Шефу.');
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

const handleSaveRecipeFromChat = async (parsed: ParsedRecipeBlock) => {
  const name = parsed.recipeName || 'Рецепт від AI Шефа';
  try {
    await savedRecipeStore.saveRecipe({
      name,
      description: parsed.recipeDescription || null,
      ingredients: parsed.ingredients,
      steps: parsed.steps,
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0
    });
    alert(`Рецепт "${name}" успішно збережено!`);
  } catch (err: any) {
    alert(err.error || 'Не вдалося зберегти рецепт.');
  }
};

const clearHistory = async () => {
  if (!confirm('Очистити історію листування з AI Шефом?')) return;
  try {
    await api.fetch('/chat', { method: 'DELETE' });
    messages.value = [];
  } catch (err: any) {
    alert(err.error || 'Не вдалося очистити історію.');
  }
};

const quickPrompts = [
  { icon: '🍲', label: 'Приготувати страву з продуктів у холодильнику' },
  { icon: '⏰', label: 'Швидка вечеря за 15 хвилин' },
  { icon: '⚡', label: 'Високобілковий сніданок' },
  { icon: '🌱', label: 'Легкий дієтичний салат' }
];
</script>

<template>
  <div class="chef-chat-container">
    <!-- Header -->
    <div class="chat-header">
      <div class="header-left">
        <div class="avatar-icon">
          <ChefHat :size="20" />
        </div>
        <div>
          <h3 class="header-title">AI Кулінарний Шеф</h3>
          <span class="header-status">
            <span class="status-dot" /> Онлайн · Знає ваші продукти
          </span>
        </div>
      </div>

      <button class="clear-btn" title="Очистити чат" @click="clearHistory">
        <Trash2 :size="16" />
      </button>
    </div>

    <!-- Subheader Fridge info -->
    <div class="inventory-bar">
      <Sparkles :size="14" class="sparkle-icon" />
      <span>Аналіз активного холодильника: доступно {{ productStore.products.length }} інгредієнтів</span>
    </div>

    <!-- Messages Container -->
    <div ref="scrollContainerRef" class="messages-area">
      <!-- Empty state -->
      <div v-if="messages.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">
          <Sparkles :size="32" class="sparkle-icon" />
        </div>
        <h4>Привіт! Я ваш персональний AI Шеф 👨‍🍳</h4>
        <p>Запитайте мене, що приготувати з наявних продуктів, або оберіть швидке запитання:</p>

        <div class="prompts-grid">
          <button
            v-for="(p, idx) in quickPrompts"
            :key="idx"
            class="prompt-card"
            @click="sendMessage(p.label)"
          >
            <span class="prompt-emoji">{{ p.icon }}</span>
            <span class="prompt-text">{{ p.label }}</span>
          </button>
        </div>
      </div>

      <!-- Messages list -->
      <div
        v-for="(m, i) in messages"
        :key="i"
        :class="['message-row', m.role === 'user' ? 'user-row' : 'ai-row']"
      >
        <div class="avatar-bubble">
          <ChefHat v-if="m.role !== 'user'" :size="16" />
          <User v-else :size="16" />
        </div>

        <div class="message-content">
          <!-- User message -->
          <div v-if="m.role === 'user'" class="user-bubble">
            {{ m.content }}
          </div>

          <!-- AI message -->
          <div v-else class="ai-bubble">
            <!-- Pre text -->
            <p v-if="extractRecipeData(m.content).preText" class="text-paragraph">
              {{ extractRecipeData(m.content).preText }}
            </p>

            <!-- Recipe block card if detected -->
            <div v-if="extractRecipeData(m.content).hasRecipe" class="recipe-card-embedded">
              <div class="card-top">
                <div class="badge">
                  <ChefHat :size="14" />
                  <span>Рецепт</span>
                </div>
                <button class="save-recipe-btn" @click="handleSaveRecipeFromChat(extractRecipeData(m.content))">
                  <Bookmark :size="14" />
                  <span>Зберегти рецепт</span>
                </button>
              </div>

              <h4 class="recipe-title">{{ extractRecipeData(m.content).recipeName }}</h4>
              <p v-if="extractRecipeData(m.content).recipeDescription" class="recipe-desc">
                {{ extractRecipeData(m.content).recipeDescription }}
              </p>

              <div v-if="extractRecipeData(m.content).ingredients.length > 0" class="recipe-sec">
                <div class="sec-label">Інгредієнти:</div>
                <ul class="ing-list">
                  <li v-for="(ing, ix) in extractRecipeData(m.content).ingredients" :key="ix">
                    <span class="bullet" /> {{ ing }}
                  </li>
                </ul>
              </div>

              <div v-if="extractRecipeData(m.content).steps.length > 0" class="recipe-sec">
                <div class="sec-label">Кроки приготування:</div>
                <ol class="steps-list">
                  <li v-for="(step, ix) in extractRecipeData(m.content).steps" :key="ix">
                    {{ step }}
                  </li>
                </ol>
              </div>
            </div>

            <!-- Post text -->
            <p v-if="extractRecipeData(m.content).postText" class="text-paragraph">
              {{ extractRecipeData(m.content).postText }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="loading" class="message-row ai-row">
        <div class="avatar-bubble">
          <ChefHat :size="16" />
        </div>
        <div class="ai-bubble loading-bubble">
          <Loader2 :size="16" class="animate-spin orange-icon" />
          <span>AI Шеф обмірковує рецепт...</span>
        </div>
      </div>
    </div>

    <!-- Input Form -->
    <form @submit.prevent="sendMessage(input)" class="input-form">
      <input
        v-model="input"
        type="text"
        class="chat-input"
        placeholder="Запитайте рецепт або що приготувати..."
        :disabled="loading"
      />
      <button type="submit" class="send-btn" :disabled="loading || !input.trim()">
        <Send :size="18" />
      </button>
    </form>
  </div>
</template>

<style scoped>
.chef-chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-primary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--accent-orange);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-primary);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.clear-btn {
  padding: 8px;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.clear-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
}

.inventory-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 18px;
  background: var(--accent-orange-bg);
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-orange);
}

.sparkle-icon {
  color: var(--accent-orange);
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: auto;
  max-width: 440px;
  padding: 24px;
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--accent-orange-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.empty-state h4 {
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0 0 6px 0;
}

.empty-state p {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 18px;
}

.prompts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
}

.prompt-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  text-align: left;
  transition: var(--transition-fast);
}

.prompt-card:hover {
  border-color: var(--accent-orange);
  transform: translateY(-1px);
}

.prompt-emoji {
  font-size: 1.2rem;
}

.prompt-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.message-row {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.user-row {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-row {
  align-self: flex-start;
}

.avatar-bubble {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-orange);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-row .avatar-bubble {
  background: var(--border-subtle);
  color: var(--text-primary);
}

.user-bubble {
  padding: 12px 16px;
  border-radius: 16px 16px 4px 16px;
  background: var(--accent-orange);
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.4;
}

.ai-bubble {
  padding: 16px;
  border-radius: 16px 16px 16px 4px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loading-bubble {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.recipe-card-embedded {
  border: 2px solid var(--accent-orange);
  background: var(--accent-orange-bg);
  border-radius: var(--radius-md);
  padding: 14px;
  margin: 6px 0;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--accent-orange);
}

.save-recipe-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--bg-card);
  border: 1px solid var(--accent-orange);
  color: var(--accent-orange);
  font-size: 0.75rem;
  font-weight: 700;
  transition: var(--transition-fast);
}

.save-recipe-btn:hover {
  background: var(--accent-orange);
  color: #ffffff;
}

.recipe-title {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.recipe-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.recipe-sec {
  margin-top: 8px;
}

.sec-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.ing-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
}

.bullet {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-orange);
  margin-right: 6px;
}

.steps-list {
  padding-left: 18px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
}

.input-form {
  display: flex;
  gap: 10px;
  padding: 12px 18px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-subtle);
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.send-btn {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: var(--accent-orange);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.orange-icon {
  color: var(--accent-orange);
}
</style>
