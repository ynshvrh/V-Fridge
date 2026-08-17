<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from '@lucide/vue';
import GoogleSignInButton from '@/components/GoogleSignInButton.vue';

const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

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
    <div class="nordic-card auth-card fade-in">
      <div class="auth-header">
        <div class="auth-icon-badge">
          <LogIn :size="20" />
        </div>
        <h2>{{ t('authSignInTitle') || 'З поверненням' }}</h2>
        <p class="auth-subtitle">{{ t('authSignInSubtitle') || 'Увійдіть для керування вашим холодильником' }}</p>
      </div>

      <div v-if="authStore.error" class="error-banner">
        <AlertCircle :size="16" />
        <span>{{ authStore.error }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="email">{{ t('authEmailLabel') || 'Email адреса' }}</label>
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
          <label class="form-label" for="password">{{ t('authPasswordLabel') || 'Пароль' }}</label>
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
          <span>{{ isSubmitting ? (t('authSigningIn') || 'Вхід...') : (t('authSignInBtn') || 'Увійти') }}</span>
          <ArrowRight :size="16" />
        </button>
      </form>

      <div class="divider-line">
        <span>або</span>
      </div>

      <GoogleSignInButton />

      <div class="auth-footer">
        <span>{{ t('authNoAccount') || 'Ще немає акаунту?' }}</span>
        <router-link to="/signup" class="auth-link">{{ t('authRegisterLink') || 'Створити акаунт' }}</router-link>
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
  padding: 28px 24px;
}

.auth-header {
  text-align: center;
  margin-bottom: 22px;
}

.auth-icon-badge {
  width: 42px;
  height: 42px;
  margin: 0 auto 12px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.auth-subtitle {
  color: var(--text-muted);
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
  justify-content: center;
}

.divider-line {
  position: relative;
  text-align: center;
  margin: 18px 0;
}

.divider-line::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-subtle);
}

.divider-line span {
  position: relative;
  background: var(--bg-surface);
  padding: 0 10px;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  display: flex;
  justify-content: center;
  gap: 5px;
}

.auth-link {
  color: var(--text-primary);
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
