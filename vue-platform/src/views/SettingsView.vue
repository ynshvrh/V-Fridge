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
  Sparkles, 
  Contrast, 
  Sliders 
} from '@lucide/vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();

const preferredLanguage = ref(authStore.user?.preferredLanguage || 'en');
const cuisinePreference = ref(authStore.user?.cuisinePreference || 'General');
const dietaryProfile = ref(authStore.user?.dietaryProfile || '');

const newPassword = ref('');
const confirmPassword = ref('');

const isSavingProfile = ref(false);
const isSavingPassword = ref(false);

const profileMessage = ref<string | null>(null);
const passwordMessage = ref<string | null>(null);
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
</script>

<template>
  <div class="settings-page fade-in">
    <header class="page-header">
      <div>
        <h1>Налаштування акаунту та інтерфейсу</h1>
        <p class="subtitle">Персоналізація оформлення, акцентні кольори, профіль та безпека</p>
      </div>
    </header>

    <div v-if="errorMessage" class="error-banner">
      <AlertCircle :size="18" />
      <span>{{ errorMessage }}</span>
    </div>

    <div class="settings-grid">
      <!-- Section 1: UI Preferences & Accent Themes -->
      <div class="glass-card settings-card col-span-full">
        <div class="card-header">
          <Palette :size="20" class="header-icon" />
          <h3>Теми оформлення та візуальні ефекти</h3>
        </div>

        <div class="theme-options-grid">
          <!-- Theme mode switcher -->
          <div class="pref-item">
            <div class="pref-info">
              <span class="pref-title">Основна тема</span>
              <span class="pref-desc">Перемикання між темним та світлим оформленням</span>
            </div>
            <div class="toggle-buttons">
              <button
                :class="['toggle-btn', themeStore.theme === 'light' ? 'active' : '']"
                @click="themeStore.setTheme('light')"
              >
                <Sun :size="16" />
                <span>Світла</span>
              </button>
              <button
                :class="['toggle-btn', themeStore.theme === 'dark' ? 'active' : '']"
                @click="themeStore.setTheme('dark')"
              >
                <Moon :size="16" />
                <span>Темна</span>
              </button>
            </div>
          </div>


          <!-- Ambient Glow Switch -->
          <div class="pref-item">
            <div class="pref-info">
              <span class="pref-title flex-title">
                <Sparkles :size="16" class="orange-icon" /> Ambient Glow Ефекти
              </span>
              <span class="pref-desc">М'яке підсвічування та фонове сяйво карток</span>
            </div>
            <label class="switch-label">
              <input
                type="checkbox"
                :checked="themeStore.ambientGlow"
                @change="themeStore.setAmbientGlow(($event.target as HTMLInputElement).checked)"
              />
              <span class="slider" />
            </label>
          </div>

          <!-- High Contrast -->
          <div class="pref-item">
            <div class="pref-info">
              <span class="pref-title flex-title">
                <Contrast :size="16" /> Високий контраст
              </span>
              <span class="pref-desc">Підвищена чіткість меж карток та текстів</span>
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
                <Sliders :size="16" /> Режим списку покупок
              </span>
              <span class="pref-desc">Спосіб викреслення покупок (кнопки або свайп)</span>
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

      <!-- Section 2: AI Chef & Language Preferences -->
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

      <!-- Section 3: User Icon & Profile Status -->
      <div class="glass-card settings-card">
        <div class="card-header">
          <User :size="20" class="header-icon" />
          <h3>Іконка та Статус профілю</h3>
        </div>

        <div class="avatar-section">
          <div class="avatar-preview">
            <User :size="32" />
          </div>
          <div class="profile-info-block">
            <span class="profile-username">{{ authStore.user?.username }}</span>
            <span class="profile-email">{{ authStore.user?.email }}</span>
          </div>
        </div>
      </div>

      <!-- Section 4: Security & Password -->
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
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--status-expired-bg);
  color: var(--status-expired);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 20px;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 14px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.col-span-full {
  grid-column: 1 / -1;
}

.settings-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.card-header h3 {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.header-icon {
  color: var(--accent-orange);
}

.theme-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.pref-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
}

.pref-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pref-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.flex-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pref-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.toggle-buttons {
  display: flex;
  gap: 6px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  transition: var(--transition-fast);
}

.toggle-btn.active {
  background: var(--accent-orange);
  color: #ffffff;
  border-color: var(--accent-orange);
}


/* Switch Slider */
.switch-label {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
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
  background-color: var(--border-subtle);
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--accent-orange);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.card-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.form-input {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.btn-primary {
  padding: 10px 18px;
  border-radius: var(--radius-md);
  background: var(--accent-orange);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.88rem;
  align-self: flex-start;
  margin-top: 6px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-preview {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-username {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.profile-email {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.orange-icon {
  color: var(--accent-orange);
}
</style>
