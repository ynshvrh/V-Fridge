import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'june-bud' | 'light-iris' | 'aqua-mist' | 'lotus-pink' | 'mint-bloom';
export type ShoppingMode = 'buttons' | 'swipe';
export type InterfaceDensity = 'comfortable' | 'compact';
export type ChefTone = 'friendly' | 'concise' | 'gourmet' | 'healthy';

export const useThemeStore = defineStore('theme', () => {
  const getInitialTheme = (): ThemeMode => {
    const saved = localStorage.getItem('v-fridge-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'light'; // Tender default light mode
  };

  const theme = ref<ThemeMode>(getInitialTheme());
  const accentColor = ref<AccentColor>(
    (localStorage.getItem('vf_accent_color') as AccentColor) || 'june-bud'
  );
  const ambientGlow = ref<boolean>(localStorage.getItem('vf_ambient_glow') !== 'false');
  const highContrast = ref<boolean>(localStorage.getItem('vf_high_contrast') === 'true');
  const density = ref<InterfaceDensity>(
    (localStorage.getItem('vf_density') as InterfaceDensity) || 'comfortable'
  );
  const shoppingMode = ref<ShoppingMode>(
    (localStorage.getItem('vf_shopping_mode') as ShoppingMode) || 'swipe'
  );
  const expiryDaysThreshold = ref<number>(
    Number(localStorage.getItem('vf_expiry_threshold')) || 3
  );
  const autoDeductOnCook = ref<boolean>(
    localStorage.getItem('vf_auto_deduct') !== 'false'
  );
  const autoMovePurchased = ref<boolean>(
    localStorage.getItem('vf_auto_move_purchased') !== 'false'
  );
  const chefTone = ref<ChefTone>(
    (localStorage.getItem('vf_chef_tone') as ChefTone) || 'friendly'
  );
  const defaultUnit = ref<string>(
    localStorage.getItem('vf_default_unit') || 'pcs'
  );

  const applyPreferencesToDOM = () => {
    document.documentElement.setAttribute('data-theme', theme.value);
    document.documentElement.setAttribute('data-accent', accentColor.value);
    document.documentElement.setAttribute('data-density', density.value);
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

  const setAccentColor = (accent: AccentColor) => {
    accentColor.value = accent;
    localStorage.setItem('vf_accent_color', accent);
    applyPreferencesToDOM();
  };

  const setDensity = (val: InterfaceDensity) => {
    density.value = val;
    localStorage.setItem('vf_density', val);
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

  const setExpiryDaysThreshold = (days: number) => {
    expiryDaysThreshold.value = days;
    localStorage.setItem('vf_expiry_threshold', days.toString());
  };

  const setAutoDeductOnCook = (val: boolean) => {
    autoDeductOnCook.value = val;
    localStorage.setItem('vf_auto_deduct', val ? 'true' : 'false');
  };

  const setAutoMovePurchased = (val: boolean) => {
    autoMovePurchased.value = val;
    localStorage.setItem('vf_auto_move_purchased', val ? 'true' : 'false');
  };

  const setChefTone = (tone: ChefTone) => {
    chefTone.value = tone;
    localStorage.setItem('vf_chef_tone', tone);
  };

  const setDefaultUnit = (unit: string) => {
    defaultUnit.value = unit;
    localStorage.setItem('vf_default_unit', unit);
  };

  applyPreferencesToDOM();

  return {
    theme,
    accentColor,
    ambientGlow,
    highContrast,
    density,
    shoppingMode,
    expiryDaysThreshold,
    autoDeductOnCook,
    autoMovePurchased,
    chefTone,
    defaultUnit,
    setTheme,
    toggleTheme,
    setAccentColor,
    setDensity,
    setAmbientGlow,
    setHighContrast,
    setShoppingMode,
    setExpiryDaysThreshold,
    setAutoDeductOnCook,
    setAutoMovePurchased,
    setChefTone,
    setDefaultUnit,
  };
});

