import type { SQLiteDatabase } from 'expo-sqlite';
import { useTimer } from '@/store/timer';
import { addLog } from '@/db/timeLogs';
import { reward } from '@/lib/rewards';

export async function finishTimer(db: SQLiteDatabase) {
  const { active, clear } = useTimer.getState();
  if (!active) return;
  const elapsed = Math.floor((Date.now() - active.startedAt) / 1000);
  const secs = active.durationSec ? Math.min(elapsed, active.durationSec) : elapsed;
  clear(); // clear first so it can never be logged twice
  if (active.phase === 'focus' && secs >= 30) {
    await reward(db, `focus:${active.startedAt}`, Math.max(1, Math.floor(secs / 60)));
  }
}