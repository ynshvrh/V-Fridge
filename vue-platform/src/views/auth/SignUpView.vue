<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { UserPlus, User, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from '@lucide/vue';

const authStore = useAuthStore();

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
    successMessage.value = res.message || 'Account created successfully! Check your inbox to verify your email.';
  }
};
</script>

<template>
  <div class="auth-page">
    <div class="glass-card auth-card fade-in">
      <div class="auth-header">
        <div class="auth-icon-badge">
          <UserPlus :size="24" />
        </div>
        <h2>Create Account</h2>
        <p class="auth-subtitle">Get started with V-Fridge smart food tracker</p>
      </div>

      <div v-if="successMessage" class="success-banner">
        <CheckCircle2 :size="20" />
        <div>
          <strong>Account Registered!</strong>
          <p>{{ successMessage }}</p>
        </div>
      </div>

      <div v-else>
        <div v-if="authStore.error" class="error-banner">
          <AlertCircle :size="18" />
          <span>{{ authStore.error }}</span>
        </div>

        <form @submit.prevent="handleSignUp" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="username">Username (Optional)</label>
            <div class="input-wrapper">
              <User class="input-icon" :size="18" />
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
            <label class="form-label" for="email">Email Address</label>
            <div class="input-wrapper">
              <Mail class="input-icon" :size="18" />
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
            <label class="form-label" for="password">Password (Min 6 chars, Max 72)</label>
            <div class="input-wrapper">
              <Lock class="input-icon" :size="18" />
              <input
                id="password"
                v-model="password"
                type="password"
                class="form-input with-icon"
                placeholder="••••••••"
                minlength="6"
                maxlength="72"
                required
              />
            </div>
          </div>

          <button type="submit" class="btn-primary auth-btn" :disabled="isSubmitting || authStore.loading">
            <span>{{ isSubmitting ? 'Creating account...' : 'Register' }}</span>
            <ArrowRight :size="18" />
          </button>
        </form>
      </div>

      <div class="auth-footer">
        <span>Already have an account?</span>
        <router-link to="/login" class="auth-link">Sign In</router-link>
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
  padding: 36px 32px;
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-icon-badge {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  border-radius: 14px;
  background: rgba(140, 83, 131, 0.2);
  border: 1px solid var(--border-strong);
  color: var(--accent-purple-hover);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 6px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(244, 63, 94, 0.12);
  border: 1px solid rgba(244, 63, 94, 0.3);
  color: var(--accent-rose);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  margin-bottom: 20px;
}

.success-banner {
  display: flex;
  gap: 12px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--accent-emerald);
  padding: 16px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  pointer-events: none;
}

.form-input.with-icon {
  padding-left: 42px;
}

.auth-btn {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  display: flex;
  justify-content: center;
  gap: 6px;
}

.auth-link {
  color: var(--accent-purple-hover);
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
