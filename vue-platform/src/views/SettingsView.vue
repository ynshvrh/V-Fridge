<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
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
  Sliders,
  Check
} from '@lucide/vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();

const preferredLanguage = ref(authStore.user?.preferredLanguage || 'uk');
const cuisinePreference = ref(authStore.user?.cuisinePreference || 'ukrainian');
const dietaryProfile = ref(authStore.user?.dietaryProfile || '');

const newPassword = ref('');
const confirmPassword = ref('');

const isSavingProfile = ref(false);
const isSavingPassword = ref(false);

const profileMessage = ref<string | null>(null);
const passwordMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

const languages = [
  { code: 'uk', label: 'Українська' },
  { code: 'en', label: 'English' }
];

const cuisines = [
  { code: 'any', label: 'Універсальна (без обмежень)' },
  { code: 'ukrainian', label: 'Українська кухня' },
  { code: 'italian', label: 'Італійська кухня' },
  { code: 'georgian', label: 'Грузинська кухня' },
  { code: 'french', label: 'Французька кухня' },
  { code: 'asian', label: 'Азійська / Паназійська' },
  { code: 'mediterranean', label: 'Середземноморська' },
  { code: 'mexican', label: 'Мексиканська' },
  { code: 'american', label: 'Американська' }
];

const handleUpdateProfile = async () => {
  isSavingProfile.value = true;
  profileMessage.value = null;
  errorMessage.value = null;
  try {
    const updated = await api.fetch<typeof authStore.user>('/auth/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({
        preferredLanguage: preferredLanguage.value,
        cuisinePreference: cuisinePreference.value,
        dietaryProfile: dietaryProfile.value || null
      })
    });
    if (updated) {
      authStore.user = updated;
      profileMessage.value = 'Налаштування AI Шефа збережено!';
      setTimeout(() => {
        profileMessage.value = null;
      }, 3000);
    }
  } catch (err) {
    const apiErr = err as ApiErrorResponse;
    errorMessage.value = apiErr.error || 'Не вдалося зберегти налаштування';
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
    await api.fetch('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword.value })
    });
    passwordMessage.value = 'Пароль успішно оновлено!';
    newPassword.value = '';
    confirmPassword.value = '';
    setTimeout(() => {
      passwordMessage.value = null;
    }, 3000);
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
    <!-- Header -->
    <header class="settings-header">
      <h1 class="page-title">Налаштування</h1>
      <p class="page-subtitle">Керування оформленням, смаковими вподобаннями AI та безпекою</p>
    </header>

    <!-- Error Global Banner -->
    <div v-if="errorMessage" class="alert-banner error-banner">
      <AlertCircle :size="16" class="flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <div class="settings-sections-stack">
      <!-- Section 1: User Account Profile -->
      <section class="nordic-card settings-card">
        <div class="card-header">
          <div class="header-icon-box">
            <User :size="16" />
          </div>
          <div>
            <h2 class="card-title">Обліковий запис</h2>
            <p class="card-desc">Інформація про користувача</p>
          </div>
        </div>

        <div class="card-body">
          <div class="profile-row">
            <div class="user-avatar-circle">
              <span>{{ (authStore.user?.username || 'U')[0].toUpperCase() }}</span>
            </div>
            <div class="user-details">
              <span class="user-name">{{ authStore.user?.username || 'Користувач' }}</span>
              <span class="user-email">{{ authStore.user?.email || 'Не вказано' }}</span>
              <div class="badge-row">
                <span v-if="authStore.user?.emailVerified" class="status-pill verified">
                  <CheckCircle2 :size="11" /> Підтверджено
                </span>
                <span v-else class="status-pill unverified">
                  <AlertCircle :size="11" /> Не підтверджено
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Visual & Interface Theme -->
      <section class="nordic-card settings-card">
        <div class="card-header">
          <div class="header-icon-box">
            <Palette :size="16" />
          </div>
          <div>
            <h2 class="card-title">Оформлення та інтерфейс</h2>
            <p class="card-desc">Налаштуйте вигляд додатку для комфортної роботи</p>
          </div>
        </div>

        <div class="card-body controls-list">
          <!-- Theme Switcher -->
          <div class="control-item">
            <div class="control-info">
              <span class="control-label">Тема оформлення</span>
              <span class="control-hint">Перемикання між темним та світлим режимами</span>
            </div>
            <div class="segmented-control">
              <button
                type="button"
                :class="['segmented-btn', themeStore.theme === 'light' ? 'active' : '']"
                @click="themeStore.setTheme('light')"
              >
                <Sun :size="14" />
                <span>Світла</span>
              </button>
              <button
                type="button"
                :class="['segmented-btn', themeStore.theme === 'dark' ? 'active' : '']"
                @click="themeStore.setTheme('dark')"
              >
                <Moon :size="14" />
                <span>Темна</span>
              </button>
            </div>
          </div>

          <!-- High Contrast -->
          <div class="control-item">
            <div class="control-info">
              <span class="control-label">Високий контраст</span>
              <span class="control-hint">Підвищена чіткість меж та елементів</span>
            </div>
            <label class="switch-control">
              <input
                type="checkbox"
                :checked="themeStore.highContrast"
                @change="themeStore.setHighContrast(($event.target as HTMLInputElement).checked)"
              />
              <span class="switch-track" />
            </label>
          </div>

          <!-- Shopping Mode -->
          <div class="control-item">
            <div class="control-info">
              <span class="control-label">Режим списку покупок</span>
              <span class="control-hint">Викреслення товарів за допомогою кнопок або свайпу</span>
            </div>
            <div class="segmented-control">
              <button
                type="button"
                :class="['segmented-btn', themeStore.shoppingMode === 'buttons' ? 'active' : '']"
                @click="themeStore.setShoppingMode('buttons')"
              >
                <Sliders :size="13" />
                <span>Кнопки</span>
              </button>
              <button
                type="button"
                :class="['segmented-btn', themeStore.shoppingMode === 'swipe' ? 'active' : '']"
                @click="themeStore.setShoppingMode('swipe')"
              >
                <span>Свайп</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: AI Chef & Culinary Preferences -->
      <section class="nordic-card settings-card">
        <div class="card-header">
          <div class="header-icon-box">
            <Globe :size="16" />
          </div>
          <div>
            <h2 class="card-title">AI Шеф та гастрономія</h2>
            <p class="card-desc">Впливає на стиль рецептів та підбір страв у планувальнику</p>
          </div>
        </div>

        <div class="card-body">
          <div v-if="profileMessage" class="alert-banner success-banner">
            <Check :size="15" />
            <span>{{ profileMessage }}</span>
          </div>

          <form @submit.prevent="handleUpdateProfile" class="form-stack">
            <div class="form-row">
              <label class="field-label" for="pref-language">Мова інтерфейсу та шефа</label>
              <select id="pref-language" v-model="preferredLanguage" class="field-select">
                <option v-for="l in languages" :key="l.code" :value="l.code">{{ l.label }}</option>
              </select>
            </div>

            <div class="form-row">
              <label class="field-label" for="pref-cuisine">Улюблена кухня</label>
              <select id="pref-cuisine" v-model="cuisinePreference" class="field-select">
                <option v-for="c in cuisines" :key="c.code" :value="c.code">{{ c.label }}</option>
              </select>
            </div>

            <div class="form-row">
              <label class="field-label" for="pref-dietary">Дієтичні обмеження або цілі</label>
              <input
                id="pref-dietary"
                v-model="dietaryProfile"
                type="text"
                class="field-input"
                placeholder="Наприклад: високобілкове, без лактози, вегетаріанське..."
              />
              <span class="field-hint">Шеф автоматично враховуватиме це при кожній генерації страв</span>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="isSavingProfile">
                <span>{{ isSavingProfile ? 'Збереження...' : 'Зберегти вподобання' }}</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- Section 4: Security & Password -->
      <section class="nordic-card settings-card">
        <div class="card-header">
          <div class="header-icon-box">
            <Lock :size="16" />
          </div>
          <div>
            <h2 class="card-title">Безпека</h2>
            <p class="card-desc">Зміна пароля доступу до акаунту</p>
          </div>
        </div>

        <div class="card-body">
          <div v-if="passwordMessage" class="alert-banner success-banner">
            <Check :size="15" />
            <span>{{ passwordMessage }}</span>
          </div>

          <form @submit.prevent="handleUpdatePassword" class="form-stack">
            <div class="form-row">
              <label class="field-label" for="new-pw">Новий пароль</label>
              <input
                id="new-pw"
                v-model="newPassword"
                type="password"
                class="field-input"
                placeholder="Мінімум 8 символів"
                autocomplete="new-password"
                required
              />
            </div>

            <div class="form-row">
              <label class="field-label" for="confirm-pw">Підтвердження нового пароля</label>
              <input
                id="confirm-pw"
                v-model="confirmPassword"
                type="password"
                class="field-input"
                placeholder="Повторіть новий пароль"
                autocomplete="new-password"
                required
              />
            </div>

            <div class="form-actions">
              <button
                type="submit"
                class="btn-primary"
                :disabled="isSavingPassword || !newPassword || newPassword.length < 6"
              >
                <span>{{ isSavingPassword ? 'Оновлення...' : 'Змінити пароль' }}</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding-bottom: 40px;
  box-sizing: border-box;
}

.settings-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin: 0;
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.error-banner {
  background: var(--status-expired-bg);
  border: 1px solid var(--status-expired-border);
  color: var(--status-expired);
}

.success-banner {
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
}

.settings-sections-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.settings-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.header-icon-box {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-title {
  font-size: 0.96rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.card-desc {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin: 1px 0 0 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Profile Row */
.profile-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.user-email {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.badge-row {
  margin-top: 4px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.status-pill.verified {
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
}

.status-pill.unverified {
  background: var(--status-soon-bg);
  border: 1px solid var(--status-soon-border);
  color: var(--status-soon);
}

/* Controls list */
.controls-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  box-sizing: border-box;
}

.control-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.control-label {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
}

.control-hint {
  font-size: 0.74rem;
  color: var(--text-muted);
}

/* Segmented Control */
.segmented-control {
  display: inline-flex;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
}

.segmented-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: calc(var(--radius-xs) - 2px);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.segmented-btn:hover {
  color: var(--text-primary);
}

.segmented-btn.active {
  background: var(--primary);
  color: var(--primary-foreground);
}

/* Switch control */
.switch-control {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  cursor: pointer;
}

.switch-control input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-track {
  position: absolute;
  inset: 0;
  background-color: var(--border-strong);
  transition: var(--transition-fast);
  border-radius: 22px;
}

.switch-track:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  transition: var(--transition-fast);
  border-radius: 50%;
}

.switch-control input:checked + .switch-track {
  background-color: var(--primary);
}

.switch-control input:checked + .switch-track:before {
  transform: translateX(18px);
}

/* Forms */
.form-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.field-select, .field-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  color: var(--text-primary);
  font-size: 0.84rem;
  transition: var(--transition-fast);
}

.field-select:focus, .field-input:focus {
  outline: none;
  border-color: var(--border-strong);
}

.field-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.form-actions {
  margin-top: 6px;
}

.btn-primary {
  padding: 8px 16px;
  font-size: 0.82rem;
}

@media (max-width: 540px) {
  .control-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .segmented-control {
    width: 100%;
  }

  .segmented-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
