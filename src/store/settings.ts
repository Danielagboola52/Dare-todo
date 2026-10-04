import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

type SettingsState = {
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  reminders: boolean;
  setReminders: (v: boolean) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (themeMode) => set({ themeMode }),
      reminders: false,
      setReminders: (reminders) => set({ reminders }),
    }),
    { name: 'settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);