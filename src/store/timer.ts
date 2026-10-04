import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActiveTimer = {
  kind: 'pomodoro' | 'timer';
  phase: 'focus' | 'break';
  taskId: number | null;
  startedAt: number;            // ms timestamp
  durationSec: number | null;   // null = stopwatch
};

type TimerState = {
  active: ActiveTimer | null;
  start: (t: ActiveTimer) => void;
  clear: () => void;
};

export const useTimer = create<TimerState>()(
  persist(
    (set) => ({
      active: null,
      start: (active) => set({ active }),
      clear: () => set({ active: null }),
    }),
    { name: 'active-timer', storage: createJSONStorage(() => AsyncStorage) }
  )
);