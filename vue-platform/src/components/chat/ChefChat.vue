<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { api } from '@/api/client';
import { useSavedRecipeStore } from '@/stores/savedRecipes';
import { useShoppingStore } from '@/stores/shopping';
import { useProductStore } from '@/stores/product';
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
  Apple,
  Utensils,
  Plus,
  Minus,
  AlertTriangle,
  X
} from '@lucide/vue';

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export interface ParsedRecipe {
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  portions: number;
}

export interface ParsedShoppingItem {
  name: string;
  quantity?: number | string;
  unit?: string;
  category: string;
}

export interface ParsedChefResponse {
  dialogueText: string;
  recipe: ParsedRecipe | null;
  shoppingItems: ParsedShoppingItem[];
}

const savedRecipeStore = useSavedRecipeStore();
const shoppingStore = useShoppingStore();
const productStore = useProductStore();

const messages = ref<ChatMessage[]>([]);
const input = ref('');
const loading = ref(false);
const scrollContainerRef = ref<HTMLDivElement | null>(null);

const copiedIndex = ref<number | null>(null);
const addedShoppingIndex = ref<number | null>(null);
const savedRecipeIndex = ref<number | null>(null);

// Cook Modal State
const cookingRecipe = ref<ParsedRecipe | null>(null);
const cookPortions = ref(2);
const cookExpiryDays = ref(3);
const isCooking = ref(false);
const cookSuccessMessage = ref<string | null>(null);

// Chef Modes
const activeMode = ref<'fridge-only' | 'quick' | 'protein' | 'healthy'>('fridge-only');

const parseChefMessage = (content: string): ParsedChefResponse => {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const recipeData = parsed.recipe;
      const ingredients = Array.isArray(recipeData?.ingredients) ? recipeData.ingredients : [];
      const steps = Array.isArray(recipeData?.steps) ? recipeData.steps : [];

      const hasValidRecipe = recipeData && (ingredients.length > 0 || steps.length > 0);

      return {
        dialogueText: parsed.message || (hasValidRecipe ? '' : trimmed),
        recipe: hasValidRecipe ? {
          name: recipeData.name || recipeData.title || 'Запропонований рецепт',
          description: recipeData.description || '',
          ingredients,
          steps,
          calories: Number(recipeData.calories) || 0,
          protein: Number(recipeData.protein) || 0,
          fat: Number(recipeData.fat) || 0,
          carbs: Number(recipeData.carbs) || 0,
          portions: Number(recipeData.portions) || 2
        } : null,
        shoppingItems: Array.isArray(parsed.suggestedShoppingItems) ? parsed.suggestedShoppingItems : []
      };
    } catch {
      // Fall through to markdown parser
    }
  }

  let textWithoutBlocks = content;
  let parsedRecipe: ParsedRecipe | null = null;
  const shoppingItems: ParsedShoppingItem[] = [];

  // 1. Extract ```recipe codeblock
  const recipeMatch = content.match(/```(?:recipe)?\s*([\s\S]*?)```/i);
  if (recipeMatch) {
    const rawRecipe = recipeMatch[1];
    textWithoutBlocks = textWithoutBlocks.replace(recipeMatch[0], '').trim();

    let name = '';
    let description = '';
    let calories = 0, protein = 0, fat = 0, carbs = 0, portions = 2;
    const ingredients: string[] = [];
    const steps: string[] = [];

    const lines = rawRecipe.split('\n').map((l) => l.trim()).filter(Boolean);
    let section: 'none' | 'ingredients' | 'steps' = 'none';

    for (const line of lines) {
      if (/^(?:Title|Name|Назва|Рецепт):/i.test(line)) {
        name = line.replace(/^(?:Title|Name|Назва|Рецепт):\s*/i, '').replace(/[*#]/g, '').trim();
      } else if (/^(?:Description|Опис):/i.test(line)) {
        description = line.replace(/^(?:Description|Опис):\s*/i, '').trim();
      } else if (/^(?:Calories|Калорії|кКал):/i.test(line)) {
        const num = line.match(/\d+/);
        if (num) calories = parseInt(num[0], 10);
      } else if (/^(?:Protein|Білки|Б):/i.test(line)) {
        const num = line.match(/\d+(?:[\.,]\d+)?/);
        if (num) protein = parseFloat(num[0].replace(',', '.'));
      } else if (/^(?:Fat|Жири|Ж):/i.test(line)) {
        const num = line.match(/\d+(?:[\.,]\d+)?/);
        if (num) fat = parseFloat(num[0].replace(',', '.'));
      } else if (/^(?:Carbs|Вуглеводи|В):/i.test(line)) {
        const num = line.match(/\d+(?:[\.,]\d+)?/);
        if (num) carbs = parseFloat(num[0].replace(',', '.'));
      } else if (/^(?:Portions|Порції):/i.test(line)) {
        const num = line.match(/\d+/);
        if (num) portions = parseInt(num[0], 10);
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

    if (ingredients.length > 0 || steps.length > 0) {
      parsedRecipe = {
        name: name || 'Запропонований рецепт',
        description,
        ingredients,
        steps,
        calories,
        protein,
        fat,
        carbs,
        portions
      };
    }
  }

  // 2. Extract ```shopping codeblock
  const shoppingMatch = content.match(/```(?:shopping)?\s*([\s\S]*?)```/i);
  if (shoppingMatch && shoppingMatch[0] !== recipeMatch?.[0]) {
    const rawShopping = shoppingMatch[1];
    textWithoutBlocks = textWithoutBlocks.replace(shoppingMatch[0], '').trim();

    const lines = rawShopping.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.startsWith('-') || line.startsWith('*')) {
        let clean = line.replace(/^[-*]\s*/, '').trim();
        let cat = 'other';
        const catMatch = clean.match(/\[([a-zA-Z\-]+)\]$/);
        if (catMatch) {
          cat = catMatch[1];
          clean = clean.replace(/\[[a-zA-Z\-]+\]$/, '').trim();
        }
        shoppingItems.push({ name: clean, category: cat });
      }
    }
  }

  // Clean any residual markdown artifacts
  textWithoutBlocks = textWithoutBlocks.replace(/```(?:recipe|shopping)?/g, '').replace(/```/g, '').trim();

  return {
    dialogueText: textWithoutBlocks,
    recipe: parsedRecipe,
    shoppingItems
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
    alert(err.error || err.message || 'Помилка генерації рецепта.');
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

const handleSaveRecipeFromChat = async (recipe: ParsedRecipe, index: number) => {
  try {
    await savedRecipeStore.saveRecipe({
      name: recipe.name,
      description: recipe.description || null,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      calories: recipe.calories,
      protein: recipe.protein,
      fat: recipe.fat,
      carbs: recipe.carbs
    });
    savedRecipeIndex.value = index;
    setTimeout(() => {
      savedRecipeIndex.value = null;
    }, 2500);
  } catch (err: any) {
    alert(err.error || 'Не вдалося зберегти рецепт.');
  }
};

const openCookModal = (recipe: ParsedRecipe) => {
  cookingRecipe.value = recipe;
  cookPortions.value = recipe.portions || 2;
  cookExpiryDays.value = 3;
  cookSuccessMessage.value = null;
};

const executeCookRecipe = async () => {
  if (!cookingRecipe.value) return;
  isCooking.value = true;
  try {
    const res = await productStore.cookRecipe({
      name: cookingRecipe.value.name,
      description: cookingRecipe.value.description,
      portions: cookPortions.value,
      ingredients: cookingRecipe.value.ingredients,
      caloriesPerPortion: cookingRecipe.value.calories,
      proteinPerPortion: cookingRecipe.value.protein,
      fatPerPortion: cookingRecipe.value.fat,
      carbsPerPortion: cookingRecipe.value.carbs,
      expiryDays: cookExpiryDays.value
    });

    if (res) {
      cookSuccessMessage.value = res.message;
      setTimeout(() => {
        cookingRecipe.value = null;
        cookSuccessMessage.value = null;
      }, 2200);
    } else {
      alert(productStore.error || 'Помилка списання інгредієнтів.');
    }
  } finally {
    isCooking.value = false;
  }
};

const handleAddAllShoppingItems = async (items: ParsedShoppingItem[], index: number) => {
  if (!items.length) return;
  try {
    for (const item of items) {
      await shoppingStore.addItem({ name: item.name, category: item.category || 'other' });
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
  if (!confirm('Очистити історію листування з AI Шефом?')) return;
  try {
    await api.fetch('/chat', { method: 'DELETE' });
    messages.value = [];
  } catch (err: any) {
    alert(err.error || 'Не вдалося очистити історію.');
  }
};

const quickPrompts = [
  { icon: Utensils, label: 'Приготувати страву з наявних продуктів' },
  { icon: Clock, label: 'Швидка вечеря за 15 хвилин' },
  { icon: Flame, label: 'Високобілковий прийом їжі' },
  { icon: Sparkles, label: 'Легкий та корисний салат' },
  { icon: AlertTriangle, label: 'Використати продукти, що скоро зіпсуються' }
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
            Продуктів в інвентарі: <strong>{{ productStore.products.length }}</strong> шт.
          </p>
        </div>
      </div>

      <div class="header-actions">
        <button class="clear-btn" title="Очистити історію" @click="clearHistory">
          <Trash2 :size="15" />
          <span class="btn-text-hide">Очистити</span>
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

    <!-- Messages Chat Area (Spacious & Full Workspace) -->
    <div ref="scrollContainerRef" class="chat-viewport">
      <!-- Empty state -->
      <div v-if="messages.length === 0 && !loading" class="chat-welcome">
        <div class="welcome-icon">
          <ChefHat :size="28" />
        </div>
        <h4>Привіт! Я ваш персональний AI Шеф-кухар</h4>
        <p>Я знаю, які продукти є у вашому холодильнику. Оберіть готову ідею або напишіть, що ви хочете приготувати:</p>

        <div class="preset-prompts-grid">
          <button
            v-for="(p, idx) in quickPrompts"
            :key="idx"
            class="preset-prompt-btn"
            @click="sendMessage(p.label)"
          >
            <component :is="p.icon" :size="15" class="prompt-icon" />
            <span class="prompt-text">{{ p.label }}</span>
          </button>
        </div>
      </div>

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
          <div v-if="m.role === 'user'" class="user-bubble">
            <p class="bubble-text">{{ m.content }}</p>
          </div>

          <div v-else class="ai-bubble">
            <div v-if="parseChefMessage(m.content).dialogueText" class="chef-dialogue-block">
              <p class="bubble-paragraph">{{ parseChefMessage(m.content).dialogueText }}</p>
            </div>

            <div v-if="parseChefMessage(m.content).recipe" class="recipe-card-box">
              <div class="recipe-card-header">
                <div class="badge badge-ai">
                  <ChefHat :size="12" />
                  <span>Рецепт</span>
                </div>
                <div class="recipe-actions">
                  <button
                    class="action-pill-btn btn-cook"
                    title="Приготувати та списати сирі інгредієнти"
                    @click="openCookModal(parseChefMessage(m.content).recipe!)"
                  >
                    <Utensils :size="13" />
                    <span>Приготувати</span>
                  </button>
                  <button
                    class="action-pill-btn"
                    title="Зберегти в обрані рецепти"
                    @click="handleSaveRecipeFromChat(parseChefMessage(m.content).recipe!, i)"
                  >
                    <Check v-if="savedRecipeIndex === i" :size="13" />
                    <Bookmark v-else :size="13" />
                    <span>{{ savedRecipeIndex === i ? 'Збережено!' : 'Зберегти' }}</span>
                  </button>
                </div>
              </div>

              <h4 class="recipe-heading">{{ parseChefMessage(m.content).recipe!.name }}</h4>
              <p v-if="parseChefMessage(m.content).recipe!.description" class="recipe-desc">
                {{ parseChefMessage(m.content).recipe!.description }}
              </p>

              <div v-if="parseChefMessage(m.content).recipe!.calories > 0" class="recipe-nutr-strip">
                <div class="nutr-stat-item">
                  <span class="stat-lbl">Калорії</span>
                  <strong class="stat-num">{{ parseChefMessage(m.content).recipe!.calories }} кКал</strong>
                </div>
                <div class="nutr-stat-item">
                  <span class="stat-lbl">Білки</span>
                  <strong class="stat-num">{{ Math.round(parseChefMessage(m.content).recipe!.protein) }}г</strong>
                </div>
                <div class="nutr-stat-item">
                  <span class="stat-lbl">Жири</span>
                  <strong class="stat-num">{{ Math.round(parseChefMessage(m.content).recipe!.fat) }}г</strong>
                </div>
                <div class="nutr-stat-item">
                  <span class="stat-lbl">Вуглеводи</span>
                  <strong class="stat-num">{{ Math.round(parseChefMessage(m.content).recipe!.carbs) }}г</strong>
                </div>
              </div>

              <div v-if="parseChefMessage(m.content).recipe!.ingredients.length > 0" class="recipe-section">
                <span class="section-label">Інгредієнти:</span>
                <ul class="ingredients-list">
                  <li v-for="(ing, ix) in parseChefMessage(m.content).recipe!.ingredients" :key="ix">
                    <span class="bullet" />
                    <span>{{ ing }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="parseChefMessage(m.content).recipe!.steps.length > 0" class="recipe-section">
                <span class="section-label">Кроки приготування:</span>
                <ol class="steps-list">
                  <li v-for="(step, ix) in parseChefMessage(m.content).recipe!.steps" :key="ix">
                    <span class="step-badge">{{ ix + 1 }}</span>
                    <span class="step-text">{{ step }}</span>
                  </li>
                </ol>
              </div>
            </div>

            <div v-if="parseChefMessage(m.content).shoppingItems.length > 0" class="shopping-suggestion-box">
              <div class="shopping-box-header">
                <div class="shopping-box-title">
                  <ShoppingCart :size="14" />
                  <span>Чого бракує в холодильнику ({{ parseChefMessage(m.content).shoppingItems.length }})</span>
                </div>
                <button
                  class="action-pill-btn btn-shopping-add"
                  @click="handleAddAllShoppingItems(parseChefMessage(m.content).shoppingItems, i)"
                >
                  <Check v-if="addedShoppingIndex === i" :size="13" />
                  <ShoppingCart v-else :size="13" />
                  <span>{{ addedShoppingIndex === i ? 'Додано у список!' : '+ Додати всі в покупки' }}</span>
                </button>
              </div>

              <div class="shopping-items-chips">
                <div
                  v-for="(item, sIdx) in parseChefMessage(m.content).shoppingItems"
                  :key="sIdx"
                  class="shopping-item-chip"
                >
                  <span class="shop-item-name">{{ item.name }}</span>
                  <span v-if="item.category" class="shop-item-cat">{{ item.category }}</span>
                </div>
              </div>
            </div>

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

      <div v-if="loading" class="message-row ai-row">
        <div class="avatar-box">
          <ChefHat :size="15" />
        </div>
        <div class="ai-bubble loading-state-bubble">
          <Loader2 :size="16" class="spin-icon" />
          <span>AI Шеф аналізує холодильник і готує персональну відповідь...</span>
        </div>
      </div>
    </div>

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

    <transition name="fade">
      <div v-if="cookingRecipe" class="modal-overlay" @click.self="cookingRecipe = null">
        <div class="modal-card nordic-card">
          <div class="modal-header">
            <div class="badge badge-ai">
              <Utensils :size="12" />
              <span>Приготувати страву</span>
            </div>
            <button class="close-btn" @click="cookingRecipe = null">
              <X :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <h3 class="cook-dish-title">{{ cookingRecipe.name }}</h3>
            <p class="cook-dish-desc">
              Приготування страви автоматично <strong>спише сирі інгредієнти з холодильника</strong> та створить контейнер готової страви на поличці.
            </p>

            <div class="cook-controls-grid">
              <div class="control-box">
                <span class="control-label">Кількість порцій у контейнері:</span>
                <div class="qty-selector">
                  <button class="qty-circle-btn" :disabled="cookPortions <= 1" @click="cookPortions--">
                    <Minus :size="14" />
                  </button>
                  <span class="qty-number">{{ cookPortions }}</span>
                  <button class="qty-circle-btn" :disabled="cookPortions >= 20" @click="cookPortions++">
                    <Plus :size="14" />
                  </button>
                </div>
              </div>

              <div class="control-box">
                <span class="control-label">Термін зберігання:</span>
                <div class="expiry-selector">
                  <select v-model="cookExpiryDays" class="form-select">
                    <option :value="2">2 дні (салати / риба)</option>
                    <option :value="3">3 дні (супи / м'ясо)</option>
                    <option :value="4">4 дні</option>
                    <option :value="7">7 днів (запіканки / соуси)</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="cookingRecipe.ingredients.length > 0" class="deduct-preview-box">
              <span class="preview-title">Буде списано з холодильника:</span>
              <ul class="preview-list">
                <li v-for="(ing, ix) in cookingRecipe.ingredients" :key="ix">
                  <span class="bullet" />
                  <span>{{ ing }}</span>
                </li>
              </ul>
            </div>

            <div v-if="cookSuccessMessage" class="success-alert">
              <Check :size="16" />
              <span>{{ cookSuccessMessage }}</span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary btn-sm" @click="cookingRecipe = null">Скасувати</button>
            <button class="btn-primary btn-sm" :disabled="isCooking" @click="executeCookRecipe">
              <Loader2 v-if="isCooking" :size="14" class="spin-icon" />
              <Utensils v-else :size="14" />
              <span>{{ isCooking ? 'Готуємо...' : 'Списати продукти та поставити в холодильник' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.chef-studio {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  min-height: 560px;
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
  gap: 12px;
}

.chef-dialogue-block {
  margin: 0;
  line-height: 1.5;
}

.bubble-paragraph {
  margin: 0;
}

.recipe-card-box {
  border: 1px solid var(--border-strong);
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
  padding: 14px;
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

.btn-cook {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

.btn-cook:hover {
  opacity: 0.9;
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
  margin-bottom: 8px;
}

.recipe-nutr-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-surface);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  margin-bottom: 10px;
  text-align: center;
}

.stat-lbl {
  display: block;
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-num {
  font-size: 0.82rem;
  font-weight: 600;
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

.shopping-suggestion-box {
  padding: 12px 14px;
  background: var(--bg-subtle);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shopping-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.shopping-box-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-shopping-add {
  background: var(--bg-surface);
  color: var(--text-primary);
}

.shopping-items-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.shopping-item-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  font-size: 0.74rem;
}

.shop-item-cat {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--text-muted);
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

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 520px;
  margin: auto;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
}

.modal-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cook-dish-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.cook-dish-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
}

.cook-controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 4px;
}

.control-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
}

.qty-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qty-circle-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.qty-circle-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.qty-number {
  font-size: 1rem;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.form-select {
  padding: 6px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  font-size: 0.8rem;
  color: var(--text-primary);
  width: 100%;
}

.deduct-preview-box {
  padding: 10px;
  background: var(--bg-subtle);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.preview-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
}

.preview-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.78rem;
  color: var(--text-primary);
}

.preview-list li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.success-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
  border-radius: var(--radius-xs);
  font-size: 0.82rem;
  font-weight: 500;
}

.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 600px) {
  .btn-text-hide {
    display: none;
  }
  .cook-controls-grid {
    grid-template-columns: 1fr;
  }
}
</style>
