import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ThemeMode = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
  const getInitialTheme = (): ThemeMode => {
    const saved = localStorage.getItem('v-fridge-theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  };

  const theme = ref<ThemeMode>(getInitialTheme());

  const setTheme = (newTheme: ThemeMode) => {
    theme.value = newTheme;
    localStorage.setItem('v-fridge-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
  };

  // Sync initial theme with DOM attribute immediately
  document.documentElement.setAttribute('data-theme', theme.value);

  return {
    theme,
    setTheme,
    toggleTheme,
  };
});
