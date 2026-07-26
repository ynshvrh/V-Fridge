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
          <LogIn :size="24" />
        </div>
        <h2>Welcome Back</h2>
        <p class="auth-subtitle">Sign in to manage your smart fridge inventory</p>
      </div>

      <div v-if="authStore.error" class="error-banner">
        <AlertCircle :size="18" />
        <span>{{ authStore.error }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
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
          <label class="form-label" for="password">Password</label>
          <div class="input-wrapper">
            <Lock class="input-icon" :size="18" />
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
          <span>{{ isSubmitting ? 'Signing in...' : 'Sign In' }}</span>
          <ArrowRight :size="18" />
        </button>
      </form>

      <GoogleSignInButton />

      <div class="auth-footer">
        <span>Don't have an account?</span>
        <router-link to="/signup" class="auth-link">Create Account</router-link>
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
  max-width: 420px;
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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
