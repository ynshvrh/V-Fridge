<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from '@/i18n';
import { UserPlus, User, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from '@lucide/vue';
import GoogleSignInButton from '@/components/GoogleSignInButton.vue';

const authStore = useAuthStore();
const { t } = useI18n();

const username = ref('');
const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const successMessage = ref<string | null>(null);

const handleSignUp = async () => {
  if (!email.value || !password.value) return;
  isSubmitting.value = true;
  successMessage.value = null;
  const res = await authStore.signup(email.value, password.value, username.value || undefined);
  isSubmitting.value = false;
  if (res.ok) {
    successMessage.value = res.message || 'Акаунт створено! Перевірте пошту для активації.';
  }
};
</script>

<template>
  <div class="auth-page">
    <div class="nordic-card auth-card fade-in">
      <div class="auth-header">
        <div class="auth-icon-badge">
          <UserPlus :size="20" />
        </div>
        <h2>{{ t('authSignUpTitle') || 'Створити акаунт' }}</h2>
        <p class="auth-subtitle">{{ t('authSignUpSubtitle') || 'Почніть користуватися розумним холодильником V-Fridge' }}</p>
      </div>

      <div v-if="successMessage" class="success-banner">
        <CheckCircle2 :size="18" />
        <div>
          <strong>{{ t('authSuccessTitle') || 'Акаунт зареєстровано!' }}</strong>
          <p>{{ successMessage }}</p>
        </div>
      </div>

      <div v-else>
        <div v-if="authStore.error" class="error-banner">
          <AlertCircle :size="16" />
          <span>{{ authStore.error }}</span>
        </div>

        <form @submit.prevent="handleSignUp" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="username">{{ t('authUsernameLabel') || "Ім'я користувача (необов'язково)" }}</label>
            <div class="input-wrapper">
              <User class="input-icon" :size="16" />
              <input
                id="username"
                v-model="username"
                type="text"
                class="form-input with-icon"
                placeholder="ChefAlex"
              />
            </div>
          </div>

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
            <label class="form-label" for="password">{{ t('authPasswordRules') || 'Пароль (мін. 8 символів)' }}</label>
            <div class="input-wrapper">
              <Lock class="input-icon" :size="16" />
              <input
                id="password"
                v-model="password"
                type="password"
                class="form-input with-icon"
                placeholder="••••••••"
                minlength="8"
                maxlength="72"
                required
              />
            </div>
          </div>

          <button type="submit" class="btn-primary auth-btn" :disabled="isSubmitting || authStore.loading">
            <span>{{ isSubmitting ? (t('authCreatingAccount') || 'Створення акаунту...') : (t('authRegisterBtn') || 'Зареєструватися') }}</span>
            <ArrowRight :size="16" />
          </button>
        </form>

        <div class="divider-line">
          <span>або</span>
        </div>

        <GoogleSignInButton />
      </div>

      <div class="auth-footer">
        <span>{{ t('authHaveAccount') || 'Вже маєте акаунт?' }}</span>
        <router-link to="/login" class="auth-link">{{ t('authSignInLink') || 'Увійти' }}</router-link>
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

.success-banner {
  display: flex;
  gap: 10px;
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
  padding: 12px;
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
