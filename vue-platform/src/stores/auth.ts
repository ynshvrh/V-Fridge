import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, type ApiErrorResponse } from '@/api/client';

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
  preferredLanguage: string;
  cuisinePreference: string;
  dietaryProfile?: string;
  avatar?: string;
}

export interface TokenPair {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: UserSummary;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserSummary | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value && !!api.getToken());

  async function fetchCurrentUser() {
    if (!api.getToken()) return;
    loading.value = true;
    error.value = null;
    try {
      user.value = await api.fetch<UserSummary>('/auth/me');
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to fetch user';
      api.removeToken();
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const pair = await api.fetch<TokenPair>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      api.setToken(pair.accessToken);
      api.setRefreshToken(pair.refreshToken);
      user.value = pair.user;
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Login failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function signup(email: string, password: string, username?: string): Promise<{ ok: boolean; message?: string }> {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.fetch<{ user: UserSummary; message: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, username })
      });
      return { ok: true, message: res.message };
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Sign-up failed';
      return { ok: false };
    } finally {
      loading.value = false;
    }
  }

  async function verifyEmail(token: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const pair = await api.fetch<TokenPair>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
      api.setToken(pair.accessToken);
      api.setRefreshToken(pair.refreshToken);
      user.value = pair.user;
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Verification failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    const refreshToken = api.getRefreshToken();
    if (refreshToken) {
      try {
        await api.fetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken })
        });
      } catch {
        // Best-effort logout
      }
    }
    api.removeToken();
    user.value = null;
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    fetchCurrentUser,
    login,
    signup,
    verifyEmail,
    logout
  };
});
