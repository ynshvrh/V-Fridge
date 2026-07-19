import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  quickActions: string[];
  setQuickActions: (actions: string[]) => void;
  lightAccentTheme: 'citrus' | 'strawberry';
  setLightAccentTheme: (theme: 'citrus' | 'strawberry') => void;
  darkAccentTheme: 'blueberry' | 'lime';
  setDarkAccentTheme: (theme: 'blueberry' | 'lime') => void;
  shoppingMode: 'buttons' | 'swipe';
  setShoppingMode: (mode: 'buttons' | 'swipe') => void;
  ambientGlow: boolean;
  setAmbientGlow: (val: boolean) => void;
  hoverGlow: boolean;
  setHoverGlow: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      quickActions: ['fridge', 'recipe', 'planner', 'shopping', 'nutrition', 'settings'],
      setQuickActions: (quickActions) => set({ quickActions }),
      lightAccentTheme: 'citrus',
      setLightAccentTheme: (lightAccentTheme) => set({ lightAccentTheme }),
      darkAccentTheme: 'blueberry',
      setDarkAccentTheme: (darkAccentTheme) => set({ darkAccentTheme }),
      shoppingMode: 'buttons',
      setShoppingMode: (shoppingMode) => set({ shoppingMode }),
      ambientGlow: true,
      setAmbientGlow: (ambientGlow) => set({ ambientGlow }),
      hoverGlow: true,
      setHoverGlow: (hoverGlow) => set({ hoverGlow }),
      highContrast: false,
      setHighContrast: (highContrast) => set({ highContrast }),
    }),
    {
      name: 'vf_preferences',
    }
  )
);
