import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  quickActions: string[];
  setQuickActions: (actions: string[]) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      quickActions: ['fridge', 'recipe', 'planner', 'shopping', 'nutrition', 'settings'],
      setQuickActions: (quickActions) => set({ quickActions }),
    }),
    {
      name: 'vf_preferences',
    }
  )
);
