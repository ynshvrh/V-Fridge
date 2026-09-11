<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore, type AccentColor, type ChefTone } from '@/stores/theme';
import { api, type ApiErrorResponse } from '@/api/client';
import { 
  CheckCircle2, 
  AlertCircle, 
  Palette, 
  Sun, 
  Moon, 
  Sliders,
  Check,
  Sparkles,
  Refrigerator,
  ShoppingCart,
  Shield,
  ChefHat
} from '@lucide/vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();

// Tab navigation state
type SettingsTab = 'appearance' | 'chef' | 'fridge' | 'security';
const activeTab = ref<SettingsTab>('appearance');

// AI Profile state
const preferredLanguage = ref(authStore.user?.preferredLanguage || 'uk');
const cuisinePreference = ref(authStore.user?.cuisinePreference || 'ukrainian');
const dietaryProfile = ref(authStore.user?.dietaryProfile || '');

// Password state
const newPassword = ref('');
const confirmPassword = ref('');

// UI Loading and notification states
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
  { code: 'asian', label: 'Паназійська / Східна' },
  { code: 'mediterranean', label: 'Середземноморська' },
  { code: 'mexican', label: 'Мексиканська' },
  { code: 'american', label: 'Американська' },
  { code: 'japanese', label: 'Японська' }
];

const accentOptions: { id: AccentColor; name: string; hex: string; desc: string }[] = [
  { id: 'june-bud', name: 'June Bud', hex: '#8CA322', desc: 'Свіжий паросток (Ref22)' },
  { id: 'light-iris', name: 'Light Iris', hex: '#7652BE', desc: 'Лаванда шефа (Ref22)' },
  { id: 'aqua-mist', name: 'Aqua Mist', hex: '#1C7B8B', desc: 'Крижаний бриз (Ref23)' },
  { id: 'lotus-pink', name: 'Lotus Pink', hex: '#B23D8A', desc: 'Ніжний лотос (Ref23)' },
  { id: 'mint-bloom', name: 'Mint Bloom', hex: '#257D4F', desc: 'Трав\'яна м\'ята (Ref23)' },
];

const dietaryPresets = [
  'Без цукру',
  'Без глютену',
  'Без лактози',
  'Вегетаріанське',
  'Веганське',
  'Кето',
  'Низьковуглеводне',
  'Високобілкове',
  'Низькокалорійне'
];

const toggleDietPreset = (preset: string) => {
  const current = dietaryProfile.value;
  const items = current
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  
  const index = items.indexOf(preset);
  if (index >= 0) {
    items.splice(index, 1);
  } else {
    items.push(preset);
  }
  dietaryProfile.value = items.join(', ');
};

const isPresetActive = (preset: string) => {
  return dietaryProfile.value
    .toLowerCase()
    .includes(preset.toLowerCase());
};

const chefTones: { id: ChefTone; title: string; hint: string }[] = [
  { id: 'friendly', title: 'Дружній', hint: 'Теплий та підтримуючий помічник' },
  { id: 'concise', title: 'Лаконічний', hint: 'Чіткі рецепти без зайвих слів' },
  { id: 'gourmet', title: 'Гурман', hint: 'Кулінарні тонкощі та авторські ідеї' },
  { id: 'healthy', title: 'ЗСЖ-фокус', hint: 'Акцент на поживність і баланс' },
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
      localStorage.setItem('vfridge_language', preferredLanguage.value);
      profileMessage.value = 'Вподобання успішно збережено!';
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
    <!-- Top Glance / Profile Hero -->
    <section class="profile-hero-card">
      <div class="profile-glance">
        <div class="user-avatar-badge">
          <span>{{ (authStore.user?.username || 'U')[0].toUpperCase() }}</span>
        </div>
        <div class="user-meta">
          <div class="user-title-row">
            <h1 class="user-name">{{ authStore.user?.username || 'Користувач' }}</h1>
            <span v-if="authStore.user?.emailVerified" class="status-pill verified">
              <CheckCircle2 :size="12" /> Підтверджено
            </span>
            <span v-else class="status-pill unverified">
              <AlertCircle :size="12" /> Не підтверджено
            </span>
          </div>
          <span class="user-email">{{ authStore.user?.email || 'Не вказано' }}</span>
        </div>
      </div>
      <div class="app-version-pill">
        <span>V-Fridge 2.0 • Ref22+Ref23</span>
      </div>
    </section>

    <!-- Global Alert Banners -->
    <div v-if="errorMessage" class="alert-banner error-banner fade-in">
      <AlertCircle :size="16" class="flex-shrink-0" />
      <span>{{ errorMessage }}</span>
      <button class="banner-close" @click="errorMessage = null">✕</button>
    </div>

    <!-- Navigation Tabs -->
    <nav class="settings-nav-bar" aria-label="Категорії налаштувань">
      <button
        type="button"
        :class="['nav-tab-btn', activeTab === 'appearance' ? 'active' : '']"
        @click="activeTab = 'appearance'"
      >
        <Palette :size="15" />
        <span>Оформлення</span>
      </button>

      <button
        type="button"
        :class="['nav-tab-btn', activeTab === 'chef' ? 'active' : '']"
        @click="activeTab = 'chef'"
      >
        <ChefHat :size="15" />
        <span>AI Шеф</span>
      </button>

      <button
        type="button"
        :class="['nav-tab-btn', activeTab === 'fridge' ? 'active' : '']"
        @click="activeTab = 'fridge'"
      >
        <Refrigerator :size="15" />
        <span>Холодильник</span>
      </button>

      <button
        type="button"
        :class="['nav-tab-btn', activeTab === 'security' ? 'active' : '']"
        @click="activeTab = 'security'"
      >
        <Shield :size="15" />
        <span>Безпека</span>
      </button>
    </nav>

    <!-- TAB 1: APPEARANCE -->
    <section v-if="activeTab === 'appearance'" class="tab-content fade-in">
      <div class="settings-card">
        <div class="card-section-header">
          <div class="icon-circle">
            <Palette :size="16" />
          </div>
          <div>
            <h2 class="section-title">Колірна палітра та акцент</h2>
            <p class="section-desc">Оберіть відтінок на основі референсів Ref22 і Ref23</p>
          </div>
        </div>

        <div class="palette-swatches-grid">
          <button
            v-for="acc in accentOptions"
            :key="acc.id"
            type="button"
            :class="['accent-swatch-card', themeStore.accentColor === acc.id ? 'selected' : '']"
            @click="themeStore.setAccentColor(acc.id)"
          >
            <div class="swatch-circle" :style="{ backgroundColor: acc.hex }">
              <Check v-if="themeStore.accentColor === acc.id" :size="14" class="swatch-check" />
            </div>
            <div class="swatch-text">
              <span class="swatch-name">{{ acc.name }}</span>
              <span class="swatch-desc">{{ acc.desc }}</span>
            </div>
          </button>
        </div>

        <div class="divider"></div>

        <div class="controls-stack">
          <!-- Theme Mode -->
          <div class="control-row">
            <div class="control-label-group">
              <span class="item-title">Тема оформлення</span>
              <span class="item-subtitle">Перемикання між ніжною світлою та контрастною темною темою</span>
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

          <!-- Density -->
          <div class="control-row">
            <div class="control-label-group">
              <span class="item-title">Щільність інтерфейсу</span>
              <span class="item-subtitle">Компактний вигляд вміщує більше карток на екрані</span>
            </div>
            <div class="segmented-control">
              <button
                type="button"
                :class="['segmented-btn', themeStore.density === 'comfortable' ? 'active' : '']"
                @click="themeStore.setDensity('comfortable')"
              >
                <span>Затишна</span>
              </button>
              <button
                type="button"
                :class="['segmented-btn', themeStore.density === 'compact' ? 'active' : '']"
                @click="themeStore.setDensity('compact')"
              >
                <span>Компактна</span>
              </button>
            </div>
          </div>

          <!-- Ambient Glow -->
          <div class="control-row">
            <div class="control-label-group">
              <span class="item-title">М'яке підсвічування свіжості</span>
              <span class="item-subtitle">Делікатний кулінарний градієнт навколо карток</span>
            </div>
            <label class="switch-control">
              <input
                type="checkbox"
                :checked="themeStore.ambientGlow"
                @change="themeStore.setAmbientGlow(($event.target as HTMLInputElement).checked)"
              />
              <span class="switch-track" />
            </label>
          </div>

          <!-- High Contrast -->
          <div class="control-row">
            <div class="control-label-group">
              <span class="item-title">Високий контраст меж</span>
              <span class="item-subtitle">Посилена видимість рамок та контролів</span>
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
        </div>
      </div>
    </section>

    <!-- TAB 2: AI CHEF & DIETARY -->
    <section v-if="activeTab === 'chef'" class="tab-content fade-in">
      <div class="settings-card">
        <div class="card-section-header">
          <div class="icon-circle">
            <ChefHat :size="16" />
          </div>
          <div>
            <h2 class="section-title">Вподобання AI Шефа</h2>
            <p class="section-desc">Впливають на персоналізовані підказки, рецепти та генерацію плану</p>
          </div>
        </div>

        <div v-if="profileMessage" class="alert-banner success-banner fade-in">
          <Check :size="15" />
          <span>{{ profileMessage }}</span>
        </div>

        <form @submit.prevent="handleUpdateProfile" class="form-stack">
          <!-- Language & Cuisine -->
          <div class="form-row-grid">
            <div class="field-box">
              <label class="field-label" for="pref-lang">Мова відповідей та інтерфейсу</label>
              <select id="pref-lang" v-model="preferredLanguage" class="field-select">
                <option v-for="l in languages" :key="l.code" :value="l.code">{{ l.label }}</option>
              </select>
            </div>

            <div class="field-box">
              <label class="field-label" for="pref-cuisine">Улюблена кухня світу</label>
              <select id="pref-cuisine" v-model="cuisinePreference" class="field-select">
                <option v-for="c in cuisines" :key="c.code" :value="c.code">{{ c.label }}</option>
              </select>
            </div>
          </div>

          <!-- AI Chef Tone -->
          <div class="field-box">
            <label class="field-label">Стиль спілкування шефа</label>
            <div class="chef-tones-grid">
              <button
                v-for="tone in chefTones"
                :key="tone.id"
                type="button"
                :class="['tone-pill-btn', themeStore.chefTone === tone.id ? 'active' : '']"
                @click="themeStore.setChefTone(tone.id)"
              >
                <span class="tone-title">{{ tone.title }}</span>
                <span class="tone-hint">{{ tone.hint }}</span>
              </button>
            </div>
          </div>

          <!-- Dietary Quick Presets -->
          <div class="field-box">
            <label class="field-label">Швидкі дієтичні фільтри</label>
            <div class="diet-tags-wrap">
              <button
                v-for="preset in dietaryPresets"
                :key="preset"
                type="button"
                :class="['diet-tag-btn', isPresetActive(preset) ? 'active' : '']"
                @click="toggleDietPreset(preset)"
              >
                <Check v-if="isPresetActive(preset)" :size="12" />
                <span>{{ preset }}</span>
              </button>
            </div>
          </div>

          <!-- Custom Dietary Input -->
          <div class="field-box">
            <label class="field-label" for="pref-dietary">Дієтичні обмеження, алергії та побажання</label>
            <textarea
              id="pref-dietary"
              v-model="dietaryProfile"
              rows="2"
              class="field-textarea"
              placeholder="Наприклад: не вживаю кінзу, без арахісу, високий вміст білка..."
            ></textarea>
            <span class="field-hint">Гнучкий опис без штучних лімітів: шеф підлаштовуватиметься під ваші запити</span>
          </div>

          <div class="form-submit-row">
            <button type="submit" class="btn-primary" :disabled="isSavingProfile">
              <Sparkles :size="14" />
              <span>{{ isSavingProfile ? 'Збереження...' : 'Зберегти налаштування шефа' }}</span>
            </button>
          </div>
        </form>
      </div>
    </section>

    <!-- TAB 3: FRIDGE & SHOPPING -->
    <section v-if="activeTab === 'fridge'" class="tab-content fade-in">
      <div class="settings-card">
        <div class="card-section-header">
          <div class="icon-circle">
            <Refrigerator :size="16" />
          </div>
          <div>
            <h2 class="section-title">Холодильник та інвентар</h2>
            <p class="section-desc">Налаштування відстеження термінів придатності та кулінарії</p>
          </div>
        </div>

        <div class="controls-stack">
          <!-- Expiry Alert Threshold -->
          <div class="control-row">
            <div class="control-label-group">
              <span class="item-title">Попередження про закінчення терміну</span>
              <span class="item-subtitle">Продукт підсвічується жовтим за вказану кількість днів</span>
            </div>
            <div class="segmented-control">
              <button
                v-for="days in [2, 3, 5, 7]"
                :key="days"
                type="button"
                :class="['segmented-btn', themeStore.expiryDaysThreshold === days ? 'active' : '']"
                @click="themeStore.setExpiryDaysThreshold(days)"
              >
                <span>{{ days }} дні</span>
              </button>
            </div>
          </div>

          <!-- Auto Deduct on Cook -->
          <div class="control-row">
            <div class="control-label-group">
              <span class="item-title">Автоматичне списання при готуванні</span>
              <span class="item-subtitle">Зменшувати залишки інгредієнтів у холодильнику після підтвердження приготування</span>
            </div>
            <label class="switch-control">
              <input
                type="checkbox"
                :checked="themeStore.autoDeductOnCook"
                @change="themeStore.setAutoDeductOnCook(($event.target as HTMLInputElement).checked)"
              />
              <span class="switch-track" />
            </label>
          </div>

          <!-- Default Measurement Unit -->
          <div class="control-row">
            <div class="control-label-group">
              <span class="item-title">Базова одиниця виміру за замовчуванням</span>
              <span class="item-subtitle">Використовується при додаванні нових продуктів</span>
            </div>
            <div class="segmented-control">
              <button
                type="button"
                :class="['segmented-btn', themeStore.defaultUnit === 'pcs' ? 'active' : '']"
                @click="themeStore.setDefaultUnit('pcs')"
              >
                <span>Штуки (шт)</span>
              </button>
              <button
                type="button"
                :class="['segmented-btn', themeStore.defaultUnit === 'kg' ? 'active' : '']"
                @click="themeStore.setDefaultUnit('kg')"
              >
                <span>Вага (кг)</span>
              </button>
              <button
                type="button"
                :class="['segmented-btn', themeStore.defaultUnit === 'l' ? 'active' : '']"
                @click="themeStore.setDefaultUnit('l')"
              >
                <span>Об'єм (л)</span>
              </button>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="card-section-header">
          <div class="icon-circle">
            <ShoppingCart :size="16" />
          </div>
          <div>
            <h2 class="section-title">Список покупок</h2>
            <p class="section-desc">Взаємодія та жести у списку покупок</p>
          </div>
        </div>

        <div class="controls-stack">
          <!-- Shopping Mode -->
          <div class="control-row">
            <div class="control-label-group">
              <span class="item-title">Режим позначення покупок</span>
              <span class="item-subtitle">Свайп праворуч на телефоні або традиційні кнопки-чекбокси</span>
            </div>
            <div class="segmented-control">
              <button
                type="button"
                :class="['segmented-btn', themeStore.shoppingMode === 'swipe' ? 'active' : '']"
                @click="themeStore.setShoppingMode('swipe')"
              >
                <span>Свайп</span>
              </button>
              <button
                type="button"
                :class="['segmented-btn', themeStore.shoppingMode === 'buttons' ? 'active' : '']"
                @click="themeStore.setShoppingMode('buttons')"
              >
                <Sliders :size="13" />
                <span>Кнопки</span>
              </button>
            </div>
          </div>

          <!-- Auto Move to Fridge -->
          <div class="control-row">
            <div class="control-label-group">
              <span class="item-title">Автоматичне перенесення в холодильник</span>
              <span class="item-subtitle">Куплені товари відразу додаються до вашого інвентарю зі збереженням категорій</span>
            </div>
            <label class="switch-control">
              <input
                type="checkbox"
                :checked="themeStore.autoMovePurchased"
                @change="themeStore.setAutoMovePurchased(($event.target as HTMLInputElement).checked)"
              />
              <span class="switch-track" />
            </label>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 4: SECURITY -->
    <section v-if="activeTab === 'security'" class="tab-content fade-in">
      <div class="settings-card">
        <div class="card-section-header">
          <div class="icon-circle">
            <Lock :size="16" />
          </div>
          <div>
            <h2 class="section-title">Безпека облікового запису</h2>
            <p class="section-desc">Зміна пароля доступу до сервісу</p>
          </div>
        </div>

        <div v-if="passwordMessage" class="alert-banner success-banner fade-in">
          <Check :size="15" />
          <span>{{ passwordMessage }}</span>
        </div>

        <form @submit.prevent="handleUpdatePassword" class="form-stack">
          <div class="field-box">
            <label class="field-label" for="new-pw">Новий пароль</label>
            <input
              id="new-pw"
              v-model="newPassword"
              type="password"
              class="field-input"
              placeholder="Мінімум 6 символів"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="field-box">
            <label class="field-label" for="confirm-pw">Підтвердження пароля</label>
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

          <div class="form-submit-row">
            <button
              type="submit"
              class="btn-primary"
              :disabled="isSavingPassword || !newPassword || newPassword.length < 6"
            >
              <span>{{ isSavingPassword ? 'Оновлення...' : 'Оновити пароль' }}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 780px;
  margin: 0 auto;
  padding-bottom: 50px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Profile Hero Card */
.profile-hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.profile-glance {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-avatar-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.user-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.status-pill.verified {
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
}

.status-pill.unverified {
  background: var(--status-warning-bg);
  border: 1px solid var(--status-warning-border);
  color: var(--status-warning);
}

.user-email {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.app-version-pill {
  font-size: 0.72rem;
  color: var(--text-muted);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

/* Alert Banners */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
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

.banner-close {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0 4px;
}

/* Navigation Tabs */
.settings-nav-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-subtle);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  overflow-x: auto;
  scrollbar-width: none;
}

.settings-nav-bar::-webkit-scrollbar {
  display: none;
}

.nav-tab-btn {
  flex: 1;
  min-width: 120px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.nav-tab-btn:hover {
  color: var(--text-primary);
}

.nav-tab-btn.active {
  background: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

/* Settings Card */
.settings-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: var(--shadow-card);
}

.card-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary-subtle);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.section-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.divider {
  height: 1px;
  background: var(--border-subtle);
  width: 100%;
}

/* Swatches Grid */
.palette-swatches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
  gap: 10px;
}

.accent-swatch-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 12px 10px;
  background: var(--bg-subtle);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.accent-swatch-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.accent-swatch-card.selected {
  border-color: var(--primary);
  background: var(--primary-subtle);
}

.swatch-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.swatch-check {
  color: #ffffff;
  stroke-width: 3;
}

.swatch-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.swatch-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.swatch-desc {
  font-size: 0.68rem;
  color: var(--text-muted);
}

/* Controls Stack */
.controls-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 14px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.control-label-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-title {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
}

.item-subtitle {
  font-size: 0.74rem;
  color: var(--text-muted);
}

/* Segmented Control */
.segmented-control {
  display: inline-flex;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
}

.segmented-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: calc(var(--radius-sm) - 2px);
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

/* Switch Control */
.switch-control {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
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
  border-radius: 999px;
}

.switch-track:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  transition: var(--transition-fast);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
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
  gap: 14px;
  width: 100%;
}

.form-row-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field-box {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.field-select, .field-input, .field-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.84rem;
  font-family: inherit;
  transition: var(--transition-fast);
}

.field-textarea {
  resize: vertical;
  min-height: 54px;
}

.field-select:focus, .field-input:focus, .field-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-subtle);
}

.field-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Chef Tones Grid */
.chef-tones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.tone-pill-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 9px 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  text-align: left;
}

.tone-pill-btn:hover {
  border-color: var(--border-strong);
}

.tone-pill-btn.active {
  background: var(--primary-subtle);
  border-color: var(--primary);
}

.tone-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.tone-hint {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Diet Tags */
.diet-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.diet-tag-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.diet-tag-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.diet-tag-btn.active {
  background: var(--primary-subtle);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
}

.form-submit-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.94;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 680px) {
  .settings-page {
    padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
  }

  .profile-hero-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .app-version-pill {
    align-self: flex-start;
  }

  .form-row-grid {
    grid-template-columns: 1fr;
  }

  .control-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .segmented-control {
    width: 100%;
  }

  .segmented-btn {
    flex: 1;
    justify-content: center;
  }

  .form-submit-row {
    width: 100%;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
</style>
