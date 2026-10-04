import type { SQLiteDatabase } from 'expo-sqlite';

export function addLog(
  db: SQLiteDatabase, taskId: number | null, kind: 'pomodoro' | 'timer', startedAtMs: number, seconds: number
) {
  return db.runAsync(
    'INSERT INTO time_logs (task_id, kind, started_at, seconds) VALUES (?, ?, ?, ?)',
    taskId, kind, new Date(startedAtMs).toISOString(), seconds
  );
}

export async function getTaskSeconds(db: SQLiteDatabase, taskId: number) {
  const r = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(seconds), 0) AS total FROM time_logs WHERE task_id = ?', taskId
  );
  return r?.total ?? 0;
}

export async function getTodayFocusSeconds(db: SQLiteDatabase, today: string) {
  const r = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(seconds), 0) AS total FROM time_logs WHERE date(started_at, 'localtime') = ?", today
  );
  return r?.total ?? 0;
}