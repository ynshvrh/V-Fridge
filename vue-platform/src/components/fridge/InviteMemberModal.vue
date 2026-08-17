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
          <UserPlus :size="20" class="header-icon" />
          <h3>Invite Member to "{{ fridgeName }}"</h3>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div v-if="successMessage" class="success-banner">
        <CheckCircle2 :size="18" />
        <span>{{ successMessage }}</span>
      </div>

      <div v-if="fridgeStore.error" class="error-banner">
        <AlertCircle :size="18" />
        <span>{{ fridgeStore.error }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="invite-email">Recipient Email Address</label>
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
          <button type="button" class="btn-secondary" @click="emit('close')">Done</button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting">
            <Send :size="16" />
            <span>{{ isSubmitting ? 'Sending...' : 'Send Invite' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-card {
  width: 100%;
  max-width: 440px;
  padding: 24px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon {
  color: var(--accent-orange);
}
.close-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
}
.success-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--accent-emerald);
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  margin-bottom: 16px;
}
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(244, 63, 94, 0.12);
  border: 1px solid rgba(244, 63, 94, 0.3);
  color: var(--accent-rose);
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  margin-bottom: 16px;
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
</style>
