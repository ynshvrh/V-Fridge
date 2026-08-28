import { ref } from 'vue';
import { api, type ApiErrorResponse } from '@/api/client';
import type { ChatMessageData } from '@/components/chat/ChefChatMessage.vue';

export function useChefChat() {
  const messages = ref<ChatMessageData[]>([]);
  const input = ref('');
  const loading = ref(false);
  const error = ref<string | null>(null);
  const activeMode = ref<'fridge-only' | 'quick' | 'protein' | 'healthy'>('fridge-only');

  async function fetchHistory() {
    loading.value = true;
    error.value = null;
    try {
      messages.value = await api.fetch<ChatMessageData[]>('/chat');
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to load chat history';
    } finally {
      loading.value = false;
    }
  }

  async function sendMessage(customPrompt?: string): Promise<boolean> {
    const textToSend = (customPrompt ?? input.value).trim();
    if (!textToSend || loading.value) return false;

    let finalPrompt = textToSend;
    if (activeMode.value === 'quick') {
      finalPrompt = `${textToSend} (пріоритет: швидке приготування за 15-20 хв)`;
    } else if (activeMode.value === 'protein') {
      finalPrompt = `${textToSend} (пріоритет: високий вміст білка)`;
    } else if (activeMode.value === 'healthy') {
      finalPrompt = `${textToSend} (пріоритет: здорова низькокалорійна страва)`;
    }

    // Optimistically push user message
    messages.value.push({ role: 'user', content: textToSend });
    input.value = '';
    loading.value = true;
    error.value = null;

    try {
      const reply = await api.fetch<ChatMessageData>('/chat', {
        method: 'POST',
        body: JSON.stringify({ content: finalPrompt })
      });
      messages.value.push(reply);
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'AI Chef is unavailable right now';
      // Add system notification message
      messages.value.push({
        role: 'assistant',
        content: `⚠️ Не вдалося отримати відповідь від Шефа (${error.value}). Спробуйте ще раз.`
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function clearHistory(): Promise<boolean> {
    loading.value = true;
    try {
      await api.fetch('/chat', { method: 'DELETE' });
      messages.value = [];
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to clear chat';
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    messages,
    input,
    loading,
    error,
    activeMode,
    fetchHistory,
    sendMessage,
    clearHistory
  };
}
