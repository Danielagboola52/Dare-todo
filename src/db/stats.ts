import type { SQLiteDatabase } from 'expo-sqlite';
import { addDays, todayStr } from '@/lib/date';

export type WeekStats = {
  days: string[];
  completedPerDay: number[];
  focusMinPerDay: number[];
  habitChecksPerDay: number[];
  totalCompleted: number;
  rate: number | null;        // 0..1, tasks due this week that got done
  bestWeekday: { name: string; count: number } | null;
};

const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function getWeekStats(db: SQLiteDatabase, today: string): Promise<WeekStats> {
  const days = [-6, -5, -4, -3, -2, -1, 0].map((n) => addDays(today, n));
  const idx = (d: string) => days.indexOf(d);

  const done = await db.getAllAsync<{ completed_at: string }>(
    'SELECT completed_at FROM tasks WHERE completed_at IS NOT NULL'
  );
  const due = await db.getAllAsync<{ completed_at: string | null }>(
    'SELECT completed_at FROM tasks WHERE due_date >= ? AND due_date <= ?', days[0], today
  );
  const logs = await db.getAllAsync<{ started_at: string; seconds: number }>(
    'SELECT started_at, seconds FROM time_logs'
  );
  const habits = await db.getAllAsync<{ day: string }>(
    'SELECT day FROM habit_logs WHERE day >= ?', days[0]
  );

  const completedPerDay = days.map(() => 0);
  const focusMinPerDay = days.map(() => 0);
  const habitChecksPerDay = days.map(() => 0);
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];

  for (const r of done) {
    const d = new Date(r.completed_at);
    weekdayCounts[d.getDay()]++;
    const i = idx(todayStr(d));
    if (i >= 0) completedPerDay[i]++;
  }
  for (const l of logs) {
    const i = idx(todayStr(new Date(l.started_at)));
    if (i >= 0) focusMinPerDay[i] += l.seconds / 60;
  }
  for (const h of habits) {
    const i = idx(h.day);
    if (i >= 0) habitChecksPerDay[i]++;
  }

  const max = Math.max(...weekdayCounts);
  const bestWeekday = max > 0 ? { name: NAMES[weekdayCounts.indexOf(max)], count: max } : null;
  const dueDone = due.filter((t) => t.completed_at).length;

  return {
    days,
    completedPerDay,
    focusMinPerDay,
    habitChecksPerDay,
    totalCompleted: completedPerDay.reduce((a, b) => a + b, 0),
    rate: due.length ? dueDone / due.length : null,
    bestWeekday,
  };
}