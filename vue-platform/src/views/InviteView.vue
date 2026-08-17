<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from '@/i18n';
import { api } from '@/api/client';
import { 
  Refrigerator, 
  Users, 
  ArrowRight, 
  MailWarning, 
  Loader2 
} from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const token = computed(() => (route.query.token as string) || '');
const loading = ref(false);
const successData = ref<{ fridgeId: number; fridgeName: string } | null>(null);
const errorMessage = ref<string | null>(null);

const canCall = computed(() => !!token.value && authStore.isAuthenticated && !!authStore.user?.emailVerified);

const acceptInvite = async () => {
  if (!token.value) {
    errorMessage.value = t('inviteTokenMissing') || 'Токен запрошення відсутній у посиланні.';
    return;
  }
  if (!authStore.isAuthenticated) return;
  if (!authStore.user?.emailVerified) return;

  loading.value = true;
  errorMessage.value = null;

  try {
    const data = await api.fetch<{ fridgeId: number; fridgeName: string }>('/fridges/accept', {
      method: 'POST',
      body: JSON.stringify({ token: token.value })
    });
    successData.value = data;
  } catch (err: any) {
    if (err.code === 'EMAIL_NOT_VERIFIED') {
      return;
    }
    errorMessage.value = err.error || err.message || t('inviteAcceptError') || 'Не вдалося прийняти запрошення.';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!authStore.user && localStorage.getItem('vfridge_access_token')) {
    await authStore.fetchCurrentUser();
  }
  if (canCall.value) {
    await acceptInvite();
  }
});

const goToLogin = () => {
  router.push(`/login?next=/invite?token=${encodeURIComponent(token.value)}`);
};

const goToSignup = () => {
  router.push(`/signup?next=/invite?token=${encodeURIComponent(token.value)}`);
};

const openFridges = () => {
  router.replace('/fridges');
};

const goToDashboard = () => {
  router.replace('/');
};
</script>

<template>
  <div class="invite-page">
    <div class="invite-card-wrapper">
      <!-- Logo Branding -->
      <router-link to="/" class="brand-link">
        <div class="logo-box">
          <Refrigerator :size="20" />
        </div>
        <div class="brand-text">
          <h2>V-Fridge</h2>
          <p>Smart Kitchen & Shared Space</p>
        </div>
      </router-link>

      <!-- Card -->
      <div class="nordic-card invite-card">
        <!-- Icon -->
        <div :class="['icon-wrapper', errorMessage ? 'error-bg' : 'normal-bg']">
          <MailWarning v-if="errorMessage" :size="24" />
          <Users v-else :size="24" />
        </div>

        <!-- States -->
        <div v-if="!token" class="card-state">
          <h3 class="card-title">{{ t('inviteInvalidTitle') || 'Недійсне посилання' }}</h3>
          <p class="card-desc">{{ t('inviteInvalidDesc') || 'Посилання для запрошення не містить токена авторизації.' }}</p>
          <button class="btn-secondary full-btn" @click="goToDashboard">{{ t('goToDashboardBtn') || 'На головну' }}</button>
        </div>

        <div v-else-if="!authStore.isAuthenticated" class="card-state">
          <h3 class="card-title">{{ t('inviteAuthRequiredTitle') || 'Необхідна авторизація' }}</h3>
          <p class="card-desc">{{ t('inviteAuthRequiredDesc') || 'Увійдіть або зареєструйтесь, щоб прийняти запрошення у спільний холодильник.' }}</p>
          <div class="btn-group">
            <button class="btn-primary full-btn" @click="goToLogin">{{ t('authSignInBtn') || 'Увійти' }}</button>
            <button class="btn-secondary full-btn" @click="goToSignup">{{ t('authRegisterLink') || 'Зареєструватися' }}</button>
          </div>
        </div>

        <div v-else-if="authStore.user && !authStore.user.emailVerified" class="card-state">
          <h3 class="card-title">{{ t('inviteVerifyRequiredTitle') || 'Підтвердьте Email' }}</h3>
          <p class="card-desc">{{ t('inviteVerifyRequiredDesc') || 'Для доступу до спільних холодильників необхідно підтвердити вашу електронну пошту.' }}</p>
          <button class="btn-primary full-btn" @click="router.push('/verify-email')">{{ t('verifyEmailBtn') || 'Підтвердити пошту' }}</button>
        </div>

        <div v-else-if="loading" class="card-state">
          <h3 class="card-title">{{ t('inviteCheckingTitle') || 'Перевірка запрошення...' }}</h3>
          <p class="card-desc">
            <Loader2 :size="16" class="spin-icon" /> {{ t('inviteProcessing') || 'Обробка вашого токена запрошення' }}
          </p>
        </div>

        <div v-else-if="successData" class="card-state">
          <h3 class="card-title">{{ t('inviteSuccessTitle') || 'Вітаємо у холодильнику' }} "{{ successData.fridgeName }}"!</h3>
          <p class="card-desc">{{ t('inviteSuccessDesc') || 'Запрошення успішно прийнято. Тепер у вас є доступ до спільного інвентаря.' }}</p>
          <button class="btn-primary full-btn flex-btn" @click="openFridges">
            <span>{{ t('viewFridgesBtn') || 'Переглянути холодильники' }}</span>
            <ArrowRight :size="16" />
          </button>
        </div>

        <div v-else-if="errorMessage" class="card-state">
          <h3 class="card-title">{{ t('inviteErrorTitle') || 'Помилка запрошення' }}</h3>
          <p class="card-desc">{{ errorMessage }}</p>
          <button class="btn-secondary full-btn" @click="goToDashboard">{{ t('goToDashboardBtn') || 'На головну' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invite-page {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.invite-card-wrapper {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.brand-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-primary);
}

.logo-box {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.1;
}

.brand-text p {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.invite-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.normal-bg {
  background: var(--primary);
  color: var(--primary-foreground);
}

.error-bg {
  background: var(--status-expired-bg);
  color: var(--status-expired);
}

.card-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.card-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0 0 6px 0;
}

.btn-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.full-btn {
  width: 100%;
  padding: 10px;
  font-size: 0.85rem;
  justify-content: center;
}

.flex-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
