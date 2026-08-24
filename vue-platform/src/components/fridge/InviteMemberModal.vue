<script setup lang="ts">
import { ref } from 'vue';
import { useFridgeStore } from '@/stores/fridge';
import { UserPlus, X, Send, CheckCircle2, AlertCircle } from '@lucide/vue';

const props = defineProps<{
  fridgeId: number;
  fridgeName: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const fridgeStore = useFridgeStore();

const email = ref('');
const isSubmitting = ref(false);
const successMessage = ref<string | null>(null);

const handleSubmit = async () => {
  if (!email.value.trim()) return;
  isSubmitting.value = true;
  successMessage.value = null;
  const success = await fridgeStore.createInvite(props.fridgeId, email.value.trim());
  isSubmitting.value = false;
  if (success) {
    successMessage.value = `Invite email sent to ${email.value.trim()}! Valid for 7 days.`;
    email.value = '';
  }
};
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="glass-card modal-card fade-in">
      <div class="modal-header">
        <div class="header-title">
          <UserPlus :size="18" class="header-icon" />
          <h3>Запросити до "{{ fridgeName }}"</h3>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div v-if="successMessage" class="success-banner">
        <CheckCircle2 :size="16" />
        <span>{{ successMessage }}</span>
      </div>

      <div v-if="fridgeStore.error" class="error-banner">
        <AlertCircle :size="16" />
        <span>{{ fridgeStore.error }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="invite-email">Email адреса отримувача *</label>
          <input
            id="invite-email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="member@example.com"
            required
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-ghost" @click="emit('close')">Закрити</button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting || !email.trim()">
            <Send :size="15" />
            <span>{{ isSubmitting ? 'Надсилання...' : 'Надіслати запрошення' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 440px;
  max-height: calc(100dvh - 32px);
  padding: 20px;
  margin: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-icon {
  color: var(--primary);
}

.close-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
  padding: 10px 12px;
  border-radius: var(--radius-xs);
  font-size: 0.82rem;
  margin-bottom: 12px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--status-expired-bg);
  border: 1px solid var(--status-expired-border);
  color: var(--status-expired);
  padding: 10px 12px;
  border-radius: var(--radius-xs);
  font-size: 0.82rem;
  margin-bottom: 12px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}
</style>
