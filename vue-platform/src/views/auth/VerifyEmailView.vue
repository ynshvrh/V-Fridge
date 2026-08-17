<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from '@/i18n';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const isVerifying = ref(true);
const success = ref(false);

onMounted(async () => {
  const token = route.query.token as string;
  if (!token) {
    isVerifying.value = false;
    success.value = false;
    authStore.error = t('verifyTokenMissing') || 'Токен підтвердження відсутній';
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
    <div class="nordic-card auth-card fade-in">
      <div v-if="isVerifying" class="state-container">
        <Loader2 class="spin-icon" :size="32" />
        <h2>{{ t('verifyingEmailTitle') || 'Підтвердження вашої пошти...' }}</h2>
        <p class="state-sub">{{ t('verifyingEmailDesc') || 'Будь ласка, зачекайте кілька секунд.' }}</p>
      </div>

      <div v-else-if="success" class="state-container">
        <div class="icon-circle success">
          <CheckCircle2 :size="24" />
        </div>
        <h2>{{ t('verifiedEmailTitle') || 'Email успішно підтверджено!' }}</h2>
        <p class="state-sub">{{ t('verifiedEmailDesc') || 'Ваш акаунт активовано. Ви вже авторизовані.' }}</p>
        <button class="btn-primary action-btn" @click="navigateHome">
          <span>{{ t('goToDashboardBtn') || 'Перейти до холодильника' }}</span>
          <ArrowRight :size="16" />
        </button>
      </div>

      <div v-else class="state-container">
        <div class="icon-circle error">
          <AlertCircle :size="24" />
        </div>
        <h2>{{ t('verifyFailedTitle') || 'Помилка підтвердження' }}</h2>
        <p class="state-sub">{{ authStore.error || (t('verifyFailedDesc') || 'Термін дії посилання закінчився або воно вже використане.') }}</p>
        <router-link to="/login" class="btn-secondary action-btn">
          <span>{{ t('backToSignInBtn') || 'Повернутися до входу' }}</span>
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
  min-height: calc(100vh - 100px);
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 32px 24px;
}

.state-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spin-icon {
  color: var(--text-primary);
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.icon-circle.success {
  background: var(--status-fresh-bg);
  color: var(--status-fresh);
  border: 1px solid var(--status-fresh-border);
}

.icon-circle.error {
  background: var(--status-expired-bg);
  color: var(--status-expired);
  border: 1px solid var(--status-expired-border);
}

.state-container h2 {
  font-size: 1.15rem;
  font-weight: 700;
}

.state-sub {
  color: var(--text-muted);
  font-size: 0.84rem;
  margin-top: 6px;
  margin-bottom: 20px;
}

.action-btn {
  width: 100%;
  justify-content: center;
}
</style>
