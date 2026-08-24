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
        <Loader2 class="spin-icon" :size="36" />
        <h2>Підтвердження пошти...</h2>
        <p class="state-sub">Будь ласка, зачекайте, перевіряємо ваш токен авторизації.</p>
      </div>

      <div v-else-if="success" class="state-container">
        <div class="icon-circle success">
          <CheckCircle2 :size="28" />
        </div>
        <h2>Пошту підтверджено!</h2>
        <p class="state-sub">Ваш акаунт успішно активовано. Ви можете перейти до додатку.</p>
        <button class="btn-primary action-btn" @click="navigateHome">
          <span>До головної</span>
          <ArrowRight :size="16" />
        </button>
      </div>

      <div v-else class="state-container">
        <div class="icon-circle error">
          <AlertCircle :size="28" />
        </div>
        <h2>Помилка підтвердження</h2>
        <p class="state-sub">{{ authStore.error || 'Посилання недійсне або термін його дії минув.' }}</p>
        <router-link to="/login" class="btn-secondary action-btn">
          <span>До сторінки входу</span>
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
  padding: 16px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 32px 24px;
}

.state-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.state-container h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.spin-icon {
  color: var(--primary);
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
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

.state-sub {
  color: var(--text-secondary);
  font-size: 0.84rem;
  margin-top: 6px;
  margin-bottom: 20px;
}

.action-btn {
  width: 100%;
  padding: 10px;
}
</style>
