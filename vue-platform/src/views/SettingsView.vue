<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { api, type ApiErrorResponse } from '@/api/client';
import { User, Globe, Lock, Upload, CheckCircle2, AlertCircle } from '@lucide/vue';

const authStore = useAuthStore();

const preferredLanguage = ref(authStore.user?.preferredLanguage || 'en');
const cuisinePreference = ref(authStore.user?.cuisinePreference || 'General');
const dietaryProfile = ref(authStore.user?.dietaryProfile || '');

const newPassword = ref('');
const confirmPassword = ref('');

const isSavingProfile = ref(false);
const isSavingPassword = ref(false);
const isUploadingAvatar = ref(false);

const profileMessage = ref<string | null>(null);
const passwordMessage = ref<string | null>(null);
const avatarMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

const languages = [
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Українська' }
];

const cuisines = ['General', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 'Ukrainian'];

const handleUpdateProfile = async () => {
  isSavingProfile.value = true;
  profileMessage.value = null;
  errorMessage.value = null;
  try {
    const updated = await api.fetch<typeof authStore.user>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        preferredLanguage: preferredLanguage.value,
        cuisinePreference: cuisinePreference.value,
        dietaryProfile: dietaryProfile.value || null
      })
    });
    if (updated) {
      authStore.user = updated;
      profileMessage.value = 'Profile preferences updated successfully!';
    }
  } catch (err) {
    const apiErr = err as ApiErrorResponse;
    errorMessage.value = apiErr.error || 'Failed to update profile';
  } finally {
    isSavingProfile.value = false;
  }
};

const handleUpdatePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  isSavingPassword.value = true;
  passwordMessage.value = null;
  errorMessage.value = null;
  try {
    await api.fetch('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ newPassword: newPassword.value })
    });
    passwordMessage.value = 'Password updated successfully!';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err) {
    const apiErr = err as ApiErrorResponse;
    errorMessage.value = apiErr.error || 'Failed to update password';
  } finally {
    isSavingPassword.value = false;
  }
};

const handleAvatarFile = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  isUploadingAvatar.value = true;
  avatarMessage.value = null;
  errorMessage.value = null;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.fetch<{ avatarUrl: string }>('/auth/avatar', {
      method: 'POST',
      body: formData
    });
    if (res.avatarUrl && authStore.user) {
      authStore.user.avatar = res.avatarUrl;
      avatarMessage.value = 'Avatar updated!';
    }
  } catch (err) {
    const apiErr = err as ApiErrorResponse;
    errorMessage.value = apiErr.error || 'Failed to upload avatar';
  } finally {
    isUploadingAvatar.value = false;
  }
};
</script>

<template>
  <div class="settings-page fade-in">
    <header class="page-header">
      <div>
        <h1>Account Settings</h1>
        <p class="subtitle">Customize preferences, avatar, and security</p>
      </div>
    </header>

    <div v-if="errorMessage" class="error-banner">
      <AlertCircle :size="18" />
      <span>{{ errorMessage }}</span>
    </div>

    <div class="settings-grid">
      <div class="glass-card settings-card">
        <div class="card-header">
          <Globe :size="20" class="header-icon" />
          <h3>Preferences & AI Chef Tuning</h3>
        </div>

        <div v-if="profileMessage" class="success-banner">
          <CheckCircle2 :size="16" />
          <span>{{ profileMessage }}</span>
        </div>

        <form @submit.prevent="handleUpdateProfile" class="card-form">
          <div class="form-group">
            <label class="form-label" for="pref-lang">Preferred Language</label>
            <select id="pref-lang" v-model="preferredLanguage" class="form-input">
              <option v-for="l in languages" :key="l.code" :value="l.code">{{ l.label }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="pref-cuisine">Cuisine Style</label>
            <select id="pref-cuisine" v-model="cuisinePreference" class="form-input">
              <option v-for="c in cuisines" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="pref-diet">Dietary Restrictions (Optional)</label>
            <input
              id="pref-diet"
              v-model="dietaryProfile"
              type="text"
              class="form-input"
              placeholder="Vegetarian, Gluten-Free, No Nuts..."
            />
          </div>

          <button type="submit" class="btn-primary" :disabled="isSavingProfile">
            <span>{{ isSavingProfile ? 'Saving...' : 'Save Preferences' }}</span>
          </button>
        </form>
      </div>

      <div class="glass-card settings-card">
        <div class="card-header">
          <User :size="20" class="header-icon" />
          <h3>Avatar & Profile Photo</h3>
        </div>

        <div v-if="avatarMessage" class="success-banner">
          <CheckCircle2 :size="16" />
          <span>{{ avatarMessage }}</span>
        </div>

        <div class="avatar-section">
          <div class="avatar-preview">
            <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="Avatar" />
            <User v-else :size="32" />
          </div>

          <label class="btn-secondary upload-btn">
            <Upload :size="16" />
            <span>{{ isUploadingAvatar ? 'Uploading...' : 'Choose Photo' }}</span>
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="file-input" @change="handleAvatarFile" />
          </label>
        </div>
      </div>

      <div class="glass-card settings-card">
        <div class="card-header">
          <Lock :size="20" class="header-icon" />
          <h3>Security & Password</h3>
        </div>

        <div v-if="passwordMessage" class="success-banner">
          <CheckCircle2 :size="16" />
          <span>{{ passwordMessage }}</span>
        </div>

        <form @submit.prevent="handleUpdatePassword" class="card-form">
          <div class="form-group">
            <label class="form-label" for="new-pass">New Password (Max 72 chars)</label>
            <input
              id="new-pass"
              v-model="newPassword"
              type="password"
              class="form-input"
              placeholder="••••••••"
              maxlength="72"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="confirm-pass">Confirm New Password</label>
            <input
              id="confirm-pass"
              v-model="confirmPassword"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn-primary" :disabled="isSavingPassword || !newPassword">
            <span>{{ isSavingPassword ? 'Updating...' : 'Update Password' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
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
  margin-bottom: 20px;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--accent-emerald);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.settings-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: var(--accent-purple-hover);
}

.card-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-preview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--accent-purple-glow);
  border: 2px solid var(--accent-purple);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--text-primary);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-btn {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.file-input {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
