import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export function useCurrentLanguage() {
  const authStore = useAuthStore();

  const currentLanguage = computed<string>(() => {
    return authStore.user?.preferredLanguage || localStorage.getItem('vfridge_language') || 'uk';
  });

  const isEnglish = computed<boolean>(() => currentLanguage.value === 'en');

  return {
    currentLanguage,
    isEnglish
  };
}
