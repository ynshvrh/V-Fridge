import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ThemeMode = 'light' | 'dark';
export type LightAccentTheme = 'citrus' | 'strawberry';
export type DarkAccentTheme = 'blueberry' | 'lime';
export type ShoppingMode = 'buttons' | 'swipe';

export const useThemeStore = defineStore('theme', () => {
  const getInitialTheme = (): ThemeMode => {
    const saved = localStorage.getItem('v-fridge-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  };

  const theme = ref<ThemeMode>(getInitialTheme());
  const lightAccentTheme = ref<LightAccentTheme>(
    (localStorage.getItem('vf_light_accent') as LightAccentTheme) || 'citrus'
  );
  const darkAccentTheme = ref<DarkAccentTheme>(
    (localStorage.getItem('vf_dark_accent') as DarkAccentTheme) || 'blueberry'
  );
  const ambientGlow = ref<boolean>(localStorage.getItem('vf_ambient_glow') !== 'false');
  const highContrast = ref<boolean>(localStorage.getItem('vf_high_contrast') === 'true');
  const shoppingMode = ref<ShoppingMode>(
    (localStorage.getItem('vf_shopping_mode') as ShoppingMode) || 'buttons'
  );

  const applyPreferencesToDOM = () => {
    document.documentElement.setAttribute('data-theme', theme.value);
    document.documentElement.setAttribute('data-accent-light', lightAccentTheme.value);
    document.documentElement.setAttribute('data-accent-dark', darkAccentTheme.value);
    document.documentElement.setAttribute('data-ambient-glow', ambientGlow.value ? 'true' : 'false');
    document.documentElement.setAttribute('data-high-contrast', highContrast.value ? 'true' : 'false');
  };

  const setTheme = (newTheme: ThemeMode) => {
    theme.value = newTheme;
    localStorage.setItem('v-fridge-theme', newTheme);
    applyPreferencesToDOM();
  };

  const toggleTheme = () => {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
  };

  const setLightAccentTheme = (accent: LightAccentTheme) => {
    lightAccentTheme.value = accent;
    localStorage.setItem('vf_light_accent', accent);
    applyPreferencesToDOM();
  };

  const setDarkAccentTheme = (accent: DarkAccentTheme) => {
    darkAccentTheme.value = accent;
    localStorage.setItem('vf_dark_accent', accent);
    applyPreferencesToDOM();
  };

  const setAmbientGlow = (val: boolean) => {
    ambientGlow.value = val;
    localStorage.setItem('vf_ambient_glow', val ? 'true' : 'false');
    applyPreferencesToDOM();
  };

  const setHighContrast = (val: boolean) => {
    highContrast.value = val;
    localStorage.setItem('vf_high_contrast', val ? 'true' : 'false');
    applyPreferencesToDOM();
  };

  const setShoppingMode = (mode: ShoppingMode) => {
    shoppingMode.value = mode;
    localStorage.setItem('vf_shopping_mode', mode);
  };

  applyPreferencesToDOM();

  return {
    theme,
    lightAccentTheme,
    darkAccentTheme,
    ambientGlow,
    highContrast,
    shoppingMode,
    setTheme,
    toggleTheme,
    setLightAccentTheme,
    setDarkAccentTheme,
    setAmbientGlow,
    setHighContrast,
    setShoppingMode,
  };
});
