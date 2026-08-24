<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from '@lucide/vue';
import GoogleSignInButton from '@/components/GoogleSignInButton.vue';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) return;
  isSubmitting.value = true;
  const success = await authStore.login(email.value, password.value);
  isSubmitting.value = false;
  if (success) {
    router.push('/');
  }
};
</script>

<template>
  <div class="auth-page">
    <div class="glass-card auth-card fade-in">
      <div class="auth-header">
        <div class="auth-icon-badge">
          <LogIn :size="20" />
        </div>
        <h2>Вхід до акаунту</h2>
        <p class="auth-subtitle">Увійдіть для доступу до вашого холодильника</p>
      </div>

      <div v-if="authStore.error" class="error-banner">
        <AlertCircle :size="16" />
        <span>{{ authStore.error }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="email">Email адреса</label>
          <div class="input-wrapper">
            <Mail class="input-icon" :size="16" />
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input with-icon"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Пароль</label>
          <div class="input-wrapper">
            <Lock class="input-icon" :size="16" />
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input with-icon"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button type="submit" class="btn-primary auth-btn" :disabled="isSubmitting || authStore.loading">
          <span>{{ isSubmitting ? 'Вхід...' : 'Увійти' }}</span>
          <ArrowRight :size="16" />
        </button>
      </form>

      <GoogleSignInButton />

      <div class="auth-footer">
        <span>Немає акаунту?</span>
        <router-link to="/signup" class="auth-link">Зареєструватися</router-link>
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
  max-width: 400px;
  padding: 28px 24px;
}

.auth-header {
  text-align: center;
  margin-bottom: 22px;
}

.auth-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.auth-icon-badge {
  width: 42px;
  height: 42px;
  margin: 0 auto 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-subtitle {
  color: var(--text-secondary);
  font-size: 0.82rem;
  margin-top: 4px;
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
  margin-bottom: 16px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}

.form-input.with-icon {
  padding-left: 38px;
}

.auth-btn {
  width: 100%;
  padding: 10px;
  margin-top: 4px;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  display: flex;
  justify-content: center;
  gap: 6px;
}

.auth-link {
  color: var(--primary);
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
