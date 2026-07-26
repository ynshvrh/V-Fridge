<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const props = defineProps<{
  next?: string;
}>();

const authStore = useAuthStore();
const router = useRouter();
const buttonRef = ref<HTMLDivElement | null>(null);

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

type GoogleCredentialResponse = { credential: string };

type GoogleAccountsId = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'small' | 'medium' | 'large';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      width?: number;
    }
  ): void;
};

declare global {
  interface Window {
    google?: {
      accounts?: { id?: GoogleAccountsId };
    };
  }
}

const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
  if (!response.credential) return;
  const success = await authStore.loginWithGoogle(response.credential);
  if (success) {
    router.push(props.next || '/');
  }
};

const initGoogleSignIn = () => {
  if (!clientId || !buttonRef.value) return;

  const gsi = window.google?.accounts?.id;
  if (gsi) {
    gsi.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });

    gsi.renderButton(buttonRef.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 320,
    });
  }
};

onMounted(() => {
  if (!clientId) return;

  if (window.google?.accounts?.id) {
    initGoogleSignIn();
  } else {
    // Load script dynamically if not present
    const existingScript = document.getElementById('google-gsi-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleSignIn();
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', initGoogleSignIn);
    }
  }
});
</script>

<template>
  <div v-if="clientId" class="google-auth-container">
    <div class="divider">
      <span>OR</span>
    </div>
    <div ref="buttonRef" class="google-btn-wrapper"></div>
  </div>
</template>

<style scoped>
.google-auth-container {
  width: 100%;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.divider {
  width: 100%;
  display: flex;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
  color: var(--text-muted);
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-subtle);
}

.divider span {
  padding: 0 12px;
}

.google-btn-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>
