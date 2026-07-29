<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isVerifying = ref(true);
const success = ref(false);

onMounted(async () => {
  const token = route.query.token as string;
  if (!token) {
    isVerifying.value = false;
    success.value = false;
    authStore.error = 'Verification token is missing';
    return;
  }

  success.value = await authStore.verifyEmail(token);
  isVerifying.value = false;
});

const navigateHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="auth-page">
    <div class="glass-card auth-card fade-in">
      <div v-if="isVerifying" class="state-container">
        <Loader2 class="spin-icon" :size="40" />
        <h2>Verifying your email...</h2>
        <p class="state-sub">Please wait while we confirm your account token.</p>
      </div>

      <div v-else-if="success" class="state-container">
        <div class="icon-circle success">
          <CheckCircle2 :size="32" />
        </div>
        <h2>Email Verified!</h2>
        <p class="state-sub">Your account has been confirmed. You are now logged in.</p>
        <button class="btn-primary action-btn" @click="navigateHome">
          <span>Go to Dashboard</span>
          <ArrowRight :size="18" />
        </button>
      </div>

      <div v-else class="state-container">
        <div class="icon-circle error">
          <AlertCircle :size="32" />
        </div>
        <h2>Verification Failed</h2>
        <p class="state-sub">{{ authStore.error || 'The verification link may have expired or already been used.' }}</p>
        <router-link to="/login" class="btn-secondary action-btn">
          <span>Back to Sign In</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 40px 32px;
}

.state-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spin-icon {
  color: var(--accent-orange);
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.icon-circle.success {
  background: rgba(16, 185, 129, 0.15);
  color: var(--accent-emerald);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.icon-circle.error {
  background: rgba(244, 63, 94, 0.15);
  color: var(--accent-rose);
  border: 1px solid rgba(244, 63, 94, 0.3);
}

.state-sub {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-top: 8px;
  margin-bottom: 24px;
}

.action-btn {
  width: 100%;
}
</style>
