<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { api } from '@/api/client';
import { useSavedRecipeStore } from '@/stores/savedRecipes';
import { useShoppingStore } from '@/stores/shopping';
import { useProductStore } from '@/stores/product';
import { useI18n } from '@/i18n';
import { 
  ChefHat, 
  Sparkles, 
  Send, 
  Trash2, 
  User, 
  Bookmark, 
  Loader2,
  ShoppingCart,
  Copy,
  Check,
  Flame,
  Clock,
  Apple
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
const shoppingStore = useShoppingStore();
const productStore = useProductStore();
const { t } = useI18n();

const messages = ref<ChatMessage[]>([]);
const input = ref('');
const loading = ref(false);
const scrollContainerRef = ref<HTMLDivElement | null>(null);
const copiedIndex = ref<number | null>(null);
const addedShoppingIndex = ref<number | null>(null);

// Chef Modes / Presets
const activeMode = ref<'fridge-only' | 'quick' | 'protein' | 'healthy'>('fridge-only');

const extractRecipeData = (content: string): ParsedRecipeBlock => {
  const codeBlockMatch = content.match(/```(?:recipe)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    const rawBlock = codeBlockMatch[1];
    const preText = content.slice(0, codeBlockMatch.index).trim();
    const postText = content.slice(codeBlockMatch.index! + codeBlockMatch[0].length).trim();

    let name = t('chefSavedRecipeTitle') || 'Рецепт від AI Шефа';
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

    let name = t('chefSavedRecipeTitle') || 'Рецепт від AI Шефа';
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
      messages.value = data.slice(-30);
    }
  } catch (err) {
    console.error('Failed to load chat history:', err);
  }
  scrollToBottom();
});

const sendMessage = async (text: string) => {
  if (!text.trim() || loading.value) return;

  let promptToSend = text.trim();
  if (activeMode.value === 'protein') {
    promptToSend += ' (Фокус: високий вміст білка)';
  } else if (activeMode.value === 'quick') {
    promptToSend += ' (Фокус: час приготування до 15 хвилин)';
  } else if (activeMode.value === 'healthy') {
    promptToSend += ' (Фокус: низькокалорійна корисна їжа)';
  }

  input.value = '';
  messages.value.push({ role: 'user', content: text.trim() });
  loading.value = true;
  scrollToBottom();

  try {
    const reply = await api.fetch<ChatMessage>('/chat', {
      method: 'POST',
      body: JSON.stringify({ content: promptToSend })
    });
    messages.value.push(reply);
  } catch (err: any) {
    alert(err.error || err.message || t('chefError') || 'Помилка генерації.');
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

const handleSaveRecipeFromChat = async (parsed: ParsedRecipeBlock) => {
  const name = parsed.recipeName || t('chefSavedRecipeTitle') || 'Рецепт від AI Шефа';
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
    alert(t('recipeSavedSuccess') || `Рецепт "${name}" збережено!`);
  } catch (err: any) {
    alert(err.error || 'Не вдалося зберегти рецепт.');
  }
};

const handleAddIngredientsToShopping = async (ingredients: string[], index: number) => {
  if (!ingredients.length) return;
  try {
    for (const ing of ingredients) {
      await shoppingStore.addItem({ name: ing, category: 'other' });
    }
    addedShoppingIndex.value = index;
    setTimeout(() => {
      addedShoppingIndex.value = null;
    }, 2500);
  } catch (err: any) {
    alert(err.error || 'Не вдалося додати до списку покупок.');
  }
};

const copyMessage = (content: string, index: number) => {
  navigator.clipboard.writeText(content);
  copiedIndex.value = index;
  setTimeout(() => {
    copiedIndex.value = null;
  }, 2000);
};

const clearHistory = async () => {
  if (!confirm(t('chefClearConfirm') || 'Очистити історію листування з AI Шефом?')) return;
  try {
    await api.fetch('/chat', { method: 'DELETE' });
    messages.value = [];
  } catch (err: any) {
    alert(err.error || 'Не вдалося очистити історію.');
  }
};

const quickPrompts = [
  { icon: '🍲', label: 'Приготувати страву з наявних продуктів' },
  { icon: '⏱️', label: 'Швидка вечеря за 15 хвилин' },
  { icon: '⚡', label: 'Високобілковий прийом їжі' },
  { icon: '🥗', label: 'Легкий та корисний салат' },
  { icon: '⏳', label: 'Використати продукти, що скоро зіпсуються' }
];
</script>

<template>
  <div class="chef-studio nordic-card">
    <!-- Top Bar with Modes & Status -->
    <header class="studio-header">
      <div class="header-main">
        <div class="chef-avatar">
          <ChefHat :size="18" />
        </div>
        <div>
          <div class="chef-title-row">
            <h3 class="chef-name">AI Culinary Chef</h3>
            <span class="online-pill">
              <span class="pulse-dot" /> Online
            </span>
          </div>
          <p class="chef-subtitle">
            {{ t('fridgeItemsCount') || 'Аналіз продуктів' }}: <strong>{{ productStore.products.length }}</strong> шт.
          </p>
        </div>
      </div>

      <div class="header-actions">
        <button class="clear-btn" :title="t('chefClearTitle') || 'Очистити історію'" @click="clearHistory">
          <Trash2 :size="15" />
          <span class="btn-text-hide">{{ t('actionDelete') || 'Очистити' }}</span>
        </button>
      </div>
    </header>

    <!-- Chef Mode Selector Bar -->
    <div class="mode-selector-bar">
      <div class="mode-chips">
        <button
          :class="['mode-chip', activeMode === 'fridge-only' ? 'active' : '']"
          @click="activeMode = 'fridge-only'"
        >
          <Sparkles :size="13" />
          <span>Тільки з холодильника</span>
        </button>
        <button
          :class="['mode-chip', activeMode === 'quick' ? 'active' : '']"
          @click="activeMode = 'quick'"
        >
          <Clock :size="13" />
          <span>До 15 хв</span>
        </button>
        <button
          :class="['mode-chip', activeMode === 'protein' ? 'active' : '']"
          @click="activeMode = 'protein'"
        >
          <Flame :size="13" />
          <span>Білкові страви</span>
        </button>
        <button
          :class="['mode-chip', activeMode === 'healthy' ? 'active' : '']"
          @click="activeMode = 'healthy'"
        >
          <Apple :size="13" />
          <span>Здоровий раціон</span>
        </button>
      </div>
    </div>

    <!-- Messages Chat Area (Spacious) -->
    <div ref="scrollContainerRef" class="chat-viewport">
      <!-- Empty state -->
      <div v-if="messages.length === 0 && !loading" class="chat-welcome">
        <div class="welcome-icon">
          <ChefHat :size="28" />
        </div>
        <h4>{{ t('chefWelcomeTitle') || 'Привіт! Я ваш персональний AI Шеф' }}</h4>
        <p>{{ t('chefWelcomeDesc') || 'Оберіть готову ідею або напишіть, що ви хочете приготувати:' }}</p>

        <div class="preset-prompts-grid">
          <button
            v-for="(p, idx) in quickPrompts"
            :key="idx"
            class="preset-prompt-btn"
            @click="sendMessage(p.label)"
          >
            <span class="prompt-icon">{{ p.icon }}</span>
            <span class="prompt-text">{{ p.label }}</span>
          </button>
        </div>
      </div>

      <!-- Message Bubbles -->
      <div
        v-for="(m, i) in messages"
        :key="i"
        :class="['message-row', m.role === 'user' ? 'user-row' : 'ai-row']"
      >
        <div class="avatar-box">
          <ChefHat v-if="m.role !== 'user'" :size="15" />
          <User v-else :size="15" />
        </div>

        <div class="message-bubble-wrapper">
          <!-- User bubble -->
          <div v-if="m.role === 'user'" class="user-bubble">
            <p class="bubble-text">{{ m.content }}</p>
          </div>

          <!-- AI bubble -->
          <div v-else class="ai-bubble">
            <!-- Text before recipe -->
            <p v-if="extractRecipeData(m.content).preText" class="bubble-paragraph">
              {{ extractRecipeData(m.content).preText }}
            </p>

            <!-- Structured Recipe Box -->
            <div v-if="extractRecipeData(m.content).hasRecipe" class="recipe-card-box">
              <div class="recipe-card-header">
                <div class="badge badge-ai">
                  <ChefHat :size="12" />
                  <span>Рецепт</span>
                </div>
                <div class="recipe-actions">
                  <button
                    class="action-pill-btn"
                    title="Зберегти в мої рецепти"
                    @click="handleSaveRecipeFromChat(extractRecipeData(m.content))"
                  >
                    <Bookmark :size="13" />
                    <span>Зберегти</span>
                  </button>
                  <button
                    v-if="extractRecipeData(m.content).ingredients.length > 0"
                    class="action-pill-btn"
                    title="Додати інгредієнти до списку покупок"
                    @click="handleAddIngredientsToShopping(extractRecipeData(m.content).ingredients, i)"
                  >
                    <Check v-if="addedShoppingIndex === i" :size="13" />
                    <ShoppingCart v-else :size="13" />
                    <span>{{ addedShoppingIndex === i ? 'Додано!' : '+ В покупки' }}</span>
                  </button>
                </div>
              </div>

              <h4 class="recipe-heading">{{ extractRecipeData(m.content).recipeName }}</h4>
              <p v-if="extractRecipeData(m.content).recipeDescription" class="recipe-desc">
                {{ extractRecipeData(m.content).recipeDescription }}
              </p>

              <!-- Ingredients -->
              <div v-if="extractRecipeData(m.content).ingredients.length > 0" class="recipe-section">
                <span class="section-label">{{ t('recipeIngredients') || 'Інгредієнти' }}:</span>
                <ul class="ingredients-list">
                  <li v-for="(ing, ix) in extractRecipeData(m.content).ingredients" :key="ix">
                    <span class="bullet" />
                    <span>{{ ing }}</span>
                  </li>
                </ul>
              </div>

              <!-- Steps -->
              <div v-if="extractRecipeData(m.content).steps.length > 0" class="recipe-section">
                <span class="section-label">{{ t('recipeSteps') || 'Кроки приготування' }}:</span>
                <ol class="steps-list">
                  <li v-for="(step, ix) in extractRecipeData(m.content).steps" :key="ix">
                    <span class="step-badge">{{ ix + 1 }}</span>
                    <span class="step-text">{{ step }}</span>
                  </li>
                </ol>
              </div>
            </div>

            <!-- Text after recipe -->
            <p v-if="extractRecipeData(m.content).postText" class="bubble-paragraph">
              {{ extractRecipeData(m.content).postText }}
            </p>

            <!-- Bottom utility buttons -->
            <div class="message-meta-actions">
              <button class="icon-utility-btn" title="Копіювати відповідь" @click="copyMessage(m.content, i)">
                <Check v-if="copiedIndex === i" :size="13" />
                <Copy v-else :size="13" />
                <span>{{ copiedIndex === i ? 'Скопійовано' : 'Копіювати' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="loading" class="message-row ai-row">
        <div class="avatar-box">
          <ChefHat :size="15" />
        </div>
        <div class="ai-bubble loading-state-bubble">
          <Loader2 :size="16" class="spin-icon" />
          <span>{{ t('chefThinking') || 'AI Шеф складає персональний рецепт...' }}</span>
        </div>
      </div>
    </div>

    <!-- Chat Prompt Input Form -->
    <form @submit.prevent="sendMessage(input)" class="chat-input-bar">
      <div class="input-container">
        <input
          v-model="input"
          type="text"
          class="prompt-input"
          placeholder="Напишіть, що ви хочете приготувати або які є побажання..."
          :disabled="loading"
        />
        <button type="submit" class="send-btn" :disabled="loading || !input.trim()" title="Надіслати">
          <Send :size="16" />
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.chef-studio {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  min-height: 580px;
  overflow: hidden;
}

.studio-header {
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chef-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chef-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chef-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.online-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  padding: 2px 7px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
}

.chef-subtitle {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 1px;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
  font-size: 0.78rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-fast);
}

.clear-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
  border-color: var(--status-expired-border);
}

.mode-selector-bar {
  padding: 8px 18px;
  background: var(--bg-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.mode-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.mode-chips::-webkit-scrollbar {
  display: none;
}

.mode-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  font-size: 0.74rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  white-space: nowrap;
  transition: var(--transition-fast);
}

.mode-chip:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.mode-chip.active {
  color: var(--primary-foreground);
  background: var(--primary);
  border-color: var(--primary);
}

/* Chat Viewport */
.chat-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg-base);
}

.chat-welcome {
  margin: auto;
  max-width: 520px;
  text-align: center;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--bg-subtle);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.chat-welcome h4 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 6px;
}

.chat-welcome p {
  font-size: 0.84rem;
  color: var(--text-muted);
  margin-bottom: 18px;
}

.preset-prompts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  width: 100%;
}

@media (min-width: 540px) {
  .preset-prompts-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.preset-prompt-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  text-align: left;
  transition: var(--transition-fast);
}

.preset-prompt-btn:hover {
  border-color: var(--border-strong);
  background: var(--bg-subtle);
}

.prompt-icon {
  font-size: 1.1rem;
}

.prompt-text {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.25;
}

/* Messages */
.message-row {
  display: flex;
  gap: 12px;
  max-width: 88%;
}

.user-row {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-row {
  align-self: flex-start;
}

.avatar-box {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-row .avatar-box {
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.message-bubble-wrapper {
  display: flex;
  flex-direction: column;
}

.user-bubble {
  padding: 10px 14px;
  border-radius: 14px 14px 2px 14px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.88rem;
  line-height: 1.45;
}

.bubble-text {
  margin: 0;
}

.ai-bubble {
  padding: 16px;
  border-radius: 14px 14px 14px 2px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  font-size: 0.88rem;
  color: var(--text-primary);
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bubble-paragraph {
  margin: 0;
}

.recipe-card-box {
  border: 1px solid var(--border-strong);
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin: 6px 0;
}

.recipe-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.recipe-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.74rem;
  font-weight: 500;
  transition: var(--transition-fast);
}

.action-pill-btn:hover {
  background: var(--primary);
  color: var(--primary-foreground);
}

.recipe-heading {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.recipe-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.recipe-section {
  margin-top: 8px;
}

.section-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.84rem;
}

.ingredients-list li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bullet {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-muted);
  flex-shrink: 0;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.steps-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.84rem;
  line-height: 1.4;
}

.step-badge {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  font-size: 0.68rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.message-meta-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}

.icon-utility-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  font-size: 0.72rem;
  transition: var(--transition-fast);
}

.icon-utility-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.loading-state-bubble {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.84rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Input Bar */
.chat-input-bar {
  padding: 12px 18px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 4px 6px 4px 12px;
  transition: var(--transition-fast);
}

.input-container:focus-within {
  border-color: var(--text-secondary);
}

.prompt-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.88rem;
}

.prompt-input::placeholder {
  color: var(--text-muted);
}

.send-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-xs);
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .btn-text-hide {
    display: none;
  }
}
</style>
