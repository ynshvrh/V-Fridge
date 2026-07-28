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
      profileMessage.value = 'Налаштування профілю успішно оновлено!';
    }
  } catch (err) {
    const apiErr = err as ApiErrorResponse;
    errorMessage.value = apiErr.error || 'Не вдалося оновити профіль';
  } finally {
    isSavingProfile.value = false;
  }
};

const handleUpdatePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Паролі не збігаються';
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
    passwordMessage.value = 'Пароль успішно оновлено!';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err) {
    const apiErr = err as ApiErrorResponse;
    errorMessage.value = apiErr.error || 'Не вдалося оновити пароль';
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
    const res = await api.fetch<{ avatarUrl: string }>('/auth/me/avatar', {
      method: 'POST',
      body: formData
    });
    if (res.avatarUrl && authStore.user) {
      authStore.user.avatar = res.avatarUrl;
      avatarMessage.value = 'Аватар успішно оновлено!';
    }
  } catch (err) {
    const apiErr = err as ApiErrorResponse;
    errorMessage.value = apiErr.error || 'Не вдалося завантажити аватар';
  } finally {
    isUploadingAvatar.value = false;
  }
};
</script>

<template>
  <div class="settings-page fade-in">
    <header class="page-header">
      <div>
        <h1>Налаштування акаунту</h1>
        <p class="subtitle">Персоналізація, аватар та безпека</p>
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
          <h3>Переваги та Налаштування AI Шефа</h3>
        </div>

        <div v-if="profileMessage" class="success-banner">
          <CheckCircle2 :size="16" />
          <span>{{ profileMessage }}</span>
        </div>

        <form @submit.prevent="handleUpdateProfile" class="card-form">
          <div class="form-group">
            <label class="form-label" for="pref-lang">Бажана мова</label>
            <select id="pref-lang" v-model="preferredLanguage" class="form-input">
              <option v-for="l in languages" :key="l.code" :value="l.code">{{ l.label }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="pref-cuisine">Стиль кухні</label>
            <select id="pref-cuisine" v-model="cuisinePreference" class="form-input">
              <option v-for="c in cuisines" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="pref-diet">Дієтичні обмеження (необов'язково)</label>
            <input
              id="pref-diet"
              v-model="dietaryProfile"
              type="text"
              class="form-input"
              placeholder="Вегетаріанське, Без глютену..."
            />
          </div>

          <button type="submit" class="btn-primary" :disabled="isSavingProfile">
            <span>{{ isSavingProfile ? 'Збереження...' : 'Зберегти налаштування' }}</span>
          </button>
        </form>
      </div>

      <div class="glass-card settings-card">
        <div class="card-header">
          <User :size="20" class="header-icon" />
          <h3>Аватар та Фото профілю</h3>
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
            <span>{{ isUploadingAvatar ? 'Завантаження...' : 'Обрати фото' }}</span>
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="file-input" @change="handleAvatarFile" />
          </label>
        </div>
      </div>

      <div class="glass-card settings-card">
        <div class="card-header">
          <Lock :size="20" class="header-icon" />
          <h3>Безпека та Зміна пароля</h3>
        </div>

        <div v-if="passwordMessage" class="success-banner">
          <CheckCircle2 :size="16" />
          <span>{{ passwordMessage }}</span>
        </div>

        <form @submit.prevent="handleUpdatePassword" class="card-form">
          <div class="form-group">
            <label class="form-label" for="new-pass">Новий пароль (мін. 8 символів)</label>
            <input
              id="new-pass"
              v-model="newPassword"
              type="password"
              class="form-input"
              placeholder="••••••••"
              minlength="8"
              maxlength="72"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="confirm-pass">Підтвердження пароля</label>
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
            <span>{{ isSavingPassword ? 'Оновлення...' : 'Оновити пароль' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.88rem;
  margin-top: 2px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--status-expired-bg);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--status-expired);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--status-fresh-bg);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: var(--status-fresh);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.settings-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--accent-orange);
}

.card-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent-orange-bg);
  border: 2px solid var(--accent-orange);
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
