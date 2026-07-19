import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  quickActions: string[];
  setQuickActions: (actions: string[]) => void;
  accentTheme: 'citrus' | 'strawberry' | 'blueberry' | 'lime';
  setAccentTheme: (theme: 'citrus' | 'strawberry' | 'blueberry' | 'lime') => void;
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
      accentTheme: 'citrus',
      setAccentTheme: (accentTheme) => set({ accentTheme }),
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
