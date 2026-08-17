<script setup lang="ts">
import { ref } from 'vue';
import { useFridgeStore } from '@/stores/fridge';
import { useI18n } from '@/i18n';
import { UserPlus, X, Send, CheckCircle2, AlertCircle } from '@lucide/vue';

const props = defineProps<{
  fridgeId: number;
  fridgeName: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const fridgeStore = useFridgeStore();
const { t } = useI18n();

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
    successMessage.value = `${t('inviteSentSuccess') || 'Запрошення надіслано на'} ${email.value.trim()}!`;
    email.value = '';
  }
};
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card nordic-card fade-in">
      <div class="modal-header">
        <div class="header-title">
          <UserPlus :size="18" class="header-icon" />
          <h3>{{ t('inviteModalTitle') || 'Запросити учасника до' }} "{{ fridgeName }}"</h3>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div v-if="successMessage" class="success-banner">
        <CheckCircle2 :size="15" />
        <span>{{ successMessage }}</span>
      </div>

      <div v-if="fridgeStore.error" class="error-banner">
        <AlertCircle :size="15" />
        <span>{{ fridgeStore.error }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="invite-email">{{ t('inviteEmailLabel') || 'Email адреса користувача' }}</label>
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
          <button type="button" class="btn-secondary btn-sm" @click="emit('close')">{{ t('actionCancel') || 'Закрити' }}</button>
          <button type="submit" class="btn-primary btn-sm" :disabled="isSubmitting">
            <Send :size="14" />
            <span>{{ isSubmitting ? (t('actionSaving') || 'Надсилання...') : (t('sendInviteBtn') || 'Надіслати запрошення') }}</span>
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
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 420px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title h3 {
  font-size: 0.95rem;
  font-weight: 600;
}

.header-icon {
  color: var(--text-muted);
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  font-size: 0.8rem;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--status-expired-bg);
  border: 1px solid var(--status-expired-border);
  color: var(--status-expired);
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  font-size: 0.8rem;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}
</style>
