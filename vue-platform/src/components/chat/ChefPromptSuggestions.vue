<script setup lang="ts">
import { Sparkles, Flame, Clock, Apple, Utensils } from '@lucide/vue';

defineProps<{
  activeMode: 'fridge-only' | 'quick' | 'protein' | 'healthy';
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-mode', mode: 'fridge-only' | 'quick' | 'protein' | 'healthy'): void;
  (e: 'send-prompt', text: string): void;
}>();

const presetPrompts = [
  'Що приготувати з моїх продуктів?',
  'Швидка вечеря за 15 хвилин',
  'Високобілковий сніданок',
  'Низькокалорійний обід'
];
</script>

<template>
  <div class="prompt-suggestions">
    <!-- Mode selector chips -->
    <div class="mode-chips">
      <button
        type="button"
        class="mode-chip"
        :class="{ active: activeMode === 'fridge-only' }"
        @click="emit('select-mode', 'fridge-only')"
      >
        <Utensils :size="13" />
        <span>Тільки з холодильника</span>
      </button>

      <button
        type="button"
        class="mode-chip"
        :class="{ active: activeMode === 'quick' }"
        @click="emit('select-mode', 'quick')"
      >
        <Clock :size="13" />
        <span>Швидко (15-20 хв)</span>
      </button>

      <button
        type="button"
        class="mode-chip"
        :class="{ active: activeMode === 'protein' }"
        @click="emit('select-mode', 'protein')"
      >
        <Flame :size="13" />
        <span>Більше білка</span>
      </button>

      <button
        type="button"
        class="mode-chip"
        :class="{ active: activeMode === 'healthy' }"
        @click="emit('select-mode', 'healthy')"
      >
        <Apple :size="13" />
        <span>Здорове / Дієтичне</span>
      </button>
    </div>

    <!-- Quick prompt pills -->
    <div class="preset-pills">
      <button
        v-for="prompt in presetPrompts"
        :key="prompt"
        type="button"
        class="prompt-pill"
        :disabled="disabled"
        @click="emit('send-prompt', prompt)"
      >
        <Sparkles :size="12" class="sparkle-icon" />
        <span>{{ prompt }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.prompt-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.mode-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mode-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--radius-full, 9999px);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.mode-chip:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.mode-chip.active {
  background: var(--primary-subtle, rgba(224, 90, 71, 0.12));
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
}

.preset-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.prompt-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: var(--radius-full, 9999px);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.78rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.prompt-pill:hover:not(:disabled) {
  background: var(--bg-subtle);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.prompt-pill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sparkle-icon {
  color: var(--primary);
}
</style>
