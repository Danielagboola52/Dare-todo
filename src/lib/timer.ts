import { addLog } from '@/db/timeLogs';
import { cancelPomodoroAlert } from '@/lib/notify';
import { reward } from '@/lib/rewards';
import { useTimer } from '@/store/timer';
import type { SQLiteDatabase } from 'expo-sqlite';

export async function finishTimer(db: SQLiteDatabase) {
  const { active, clear } = useTimer.getState();
  if (!active) return;
  const elapsed = Math.floor((Date.now() - active.startedAt) / 1000);
  const secs = active.durationSec ? Math.min(elapsed, active.durationSec) : elapsed;
  clear(); // clear first so it can never be logged twice
  cancelPomodoroAlert();
  if (active.phase === 'focus' && secs >= 30) {
    await addLog(db, active.taskId, active.kind, active.startedAt, secs);
    await reward(db, `focus:${active.startedAt}`, Math.max(1, Math.floor(secs / 60)));
  }
}