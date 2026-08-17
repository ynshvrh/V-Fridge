<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useI18n, type Locale } from '@/i18n';
import { api, type ApiErrorResponse } from '@/api/client';
import { 
  User, 
  Globe, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Palette, 
  Sun, 
  Moon, 
  Contrast, 
  Sliders 
} from '@lucide/vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const { t, locale, setLocale } = useI18n();

const preferredLanguage = ref<Locale>(locale.value);
const cuisinePreference = ref(authStore.user?.cuisinePreference || 'General');
const dietaryProfile = ref(authStore.user?.dietaryProfile || '');

const newPassword = ref('');
const confirmPassword = ref('');

const isSavingProfile = ref(false);
const isSavingPassword = ref(false);

const profileMessage = ref<string | null>(null);
const passwordMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

watch(locale, (newLoc) => {
  preferredLanguage.value = newLoc;
});

const languages = [
  { code: 'uk', label: 'Українська' },
  { code: 'en', label: 'English' }
];

const cuisines = ['General', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 'Ukrainian'];

const handleUpdateProfile = async () => {
  isSavingProfile.value = true;
  profileMessage.value = null;
  errorMessage.value = null;
  try {
    setLocale(preferredLanguage.value);
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
      profileMessage.value = t('settingsSavedSuccess') || 'Налаштування успішно збережено!';
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
    errorMessage.value = t('passwordMismatch') || 'Паролі не збігаються';
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
    passwordMessage.value = t('passwordUpdatedSuccess') || 'Пароль успішно оновлено!';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err) {
    const apiErr = err as ApiErrorResponse;
    errorMessage.value = apiErr.error || 'Не вдалося оновити пароль';
  } finally {
    isSavingPassword.value = false;
  }
};
</script>

<template>
  <div class="settings-page fade-in">
    <header class="page-header">
      <div>
        <h2 class="section-heading">{{ t('navSettings') }}</h2>
        <p class="section-subheading">{{ t('dashboardQuickSettingsDesc') }}</p>
      </div>
    </header>

    <div v-if="errorMessage" class="error-banner">
      <AlertCircle :size="16" />
      <span>{{ errorMessage }}</span>
    </div>

    <div class="settings-grid">
      <!-- Section 1: UI & Appearance -->
      <div class="nordic-card settings-card col-span-full">
        <div class="card-header">
          <Palette :size="17" class="header-icon" />
          <h3>{{ t('appearanceTitle') || 'Оформлення та вигляд' }}</h3>
        </div>

        <div class="theme-options-grid">
          <!-- Theme Mode -->
          <div class="pref-item">
            <div class="pref-info">
              <span class="pref-title">{{ t('themeModeTitle') || 'Тема інтерфейсу' }}</span>
              <span class="pref-desc">{{ t('themeModeDesc') || 'Перемикання між темною та світлою темою' }}</span>
            </div>
            <div class="toggle-buttons">
              <button
                :class="['toggle-btn', themeStore.theme === 'light' ? 'active' : '']"
                @click="themeStore.setTheme('light')"
              >
                <Sun :size="14" />
                <span>{{ t('lightTheme') || 'Світла' }}</span>
              </button>
              <button
                :class="['toggle-btn', themeStore.theme === 'dark' ? 'active' : '']"
                @click="themeStore.setTheme('dark')"
              >
                <Moon :size="14" />
                <span>{{ t('darkTheme') || 'Темна' }}</span>
              </button>
            </div>
          </div>

          <!-- High Contrast -->
          <div class="pref-item">
            <div class="pref-info">
              <span class="pref-title flex-title">
                <Contrast :size="15" /> {{ t('highContrastTitle') || 'Високий контраст' }}
              </span>
              <span class="pref-desc">{{ t('highContrastDesc') || 'Посилена чіткість меж та ліній' }}</span>
            </div>
            <label class="switch-label">
              <input
                type="checkbox"
                :checked="themeStore.highContrast"
                @change="themeStore.setHighContrast(($event.target as HTMLInputElement).checked)"
              />
              <span class="slider" />
            </label>
          </div>

          <!-- Shopping Mode -->
          <div class="pref-item">
            <div class="pref-info">
              <span class="pref-title flex-title">
                <Sliders :size="15" /> {{ t('shoppingModeTitle') || 'Режим списку покупок' }}
              </span>
              <span class="pref-desc">{{ t('shoppingModeDesc') || 'Викреслення покупок кнопкою чи свайпом' }}</span>
            </div>
            <div class="toggle-buttons">
              <button
                :class="['toggle-btn', themeStore.shoppingMode === 'buttons' ? 'active' : '']"
                @click="themeStore.setShoppingMode('buttons')"
              >
                <span>Кнопки</span>
              </button>
              <button
                :class="['toggle-btn', themeStore.shoppingMode === 'swipe' ? 'active' : '']"
                @click="themeStore.setShoppingMode('swipe')"
              >
                <span>Свайп</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: AI Chef & Localization Preferences -->
      <div class="nordic-card settings-card">
        <div class="card-header">
          <Globe :size="17" class="header-icon" />
          <h3>{{ t('languageAndDietTitle') || 'Мова та Кулінарні переваги' }}</h3>
        </div>

        <div v-if="profileMessage" class="success-banner">
          <CheckCircle2 :size="15" />
          <span>{{ profileMessage }}</span>
        </div>

        <form @submit.prevent="handleUpdateProfile" class="card-form">
          <div class="form-group">
            <label class="form-label">{{ t('languageLabel') || 'Мова інтерфейсу' }}</label>
            <select v-model="preferredLanguage" class="form-input">
              <option v-for="l in languages" :key="l.code" :value="l.code">{{ l.label }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('cuisineLabel') || 'Улюблена кухня' }}</label>
            <select v-model="cuisinePreference" class="form-input">
              <option v-for="c in cuisines" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('dietaryLabel') || 'Дієтичні обмеження' }}</label>
            <input
              v-model="dietaryProfile"
              type="text"
              class="form-input"
              :placeholder="t('dietaryPlaceholder') || 'Вегетаріанське, Без лактози...'"
            />
          </div>

          <button type="submit" class="btn-primary btn-sm" :disabled="isSavingProfile">
            <span>{{ isSavingProfile ? (t('actionSaving') || 'Збереження...') : (t('actionSave') || 'Зберегти налаштування') }}</span>
          </button>
        </form>
      </div>

      <!-- Section 3: Profile Info -->
      <div class="nordic-card settings-card">
        <div class="card-header">
          <User :size="17" class="header-icon" />
          <h3>{{ t('profileStatusTitle') || 'Профіль користувача' }}</h3>
        </div>

        <div class="profile-box">
          <div class="avatar-circle">
            {{ (authStore.user?.username || authStore.user?.email || 'U')[0].toUpperCase() }}
          </div>
          <div class="profile-details">
            <span class="user-name-text">{{ authStore.user?.username || 'User' }}</span>
            <span class="user-email-text">{{ authStore.user?.email }}</span>
            <span v-if="authStore.user?.emailVerified" class="verified-badge">
              ✓ Email підтверджено
            </span>
          </div>
        </div>
      </div>

      <!-- Section 4: Password Security -->
      <div class="nordic-card settings-card">
        <div class="card-header">
          <Lock :size="17" class="header-icon" />
          <h3>{{ t('securityTitle') || 'Зміна пароля' }}</h3>
        </div>

        <div v-if="passwordMessage" class="success-banner">
          <CheckCircle2 :size="15" />
          <span>{{ passwordMessage }}</span>
        </div>

        <form @submit.prevent="handleUpdatePassword" class="card-form">
          <div class="form-group">
            <label class="form-label">{{ t('newPasswordLabel') || 'Новий пароль (мін. 8 символів)' }}</label>
            <input
              v-model="newPassword"
              type="password"
              class="form-input"
              placeholder="••••••••"
              minlength="8"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('confirmPasswordLabel') || 'Підтвердження пароля' }}</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn-primary btn-sm" :disabled="isSavingPassword || !newPassword">
            <span>{{ isSavingPassword ? (t('actionSaving') || 'Оновлення...') : (t('updatePasswordBtn') || 'Оновити пароль') }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-heading {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.section-subheading {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-xs);
  background: var(--status-expired-bg);
  border: 1px solid var(--status-expired-border);
  color: var(--status-expired);
  font-size: 0.82rem;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
  font-size: 0.8rem;
  margin-bottom: 10px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

.col-span-full {
  grid-column: 1 / -1;
}

.settings-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.card-header h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-icon {
  color: var(--text-muted);
}

.theme-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.pref-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
}

.pref-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pref-title {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
}

.flex-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pref-desc {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.toggle-buttons {
  display: flex;
  gap: 4px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: var(--radius-xs);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 500;
  transition: var(--transition-fast);
}

.toggle-btn.active {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

/* Switch */
.switch-label {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 20px;
}

.switch-label input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--border-strong);
  transition: .2s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary);
}

input:checked + .slider:before {
  transform: translateX(18px);
}

.card-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-sm {
  align-self: flex-start;
  padding: 6px 12px;
  font-size: 0.8rem;
}

.profile-box {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0;
}

.avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.user-email-text {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.verified-badge {
  font-size: 0.68rem;
  color: var(--status-fresh);
  font-weight: 600;
  margin-top: 2px;
}
</style>
