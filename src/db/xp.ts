import type { SQLiteDatabase } from 'expo-sqlite';
import { calcStreak } from '@/lib/streak';
import { todayStr } from '@/lib/date';

const TITLES = ['Rookie', 'Apprentice', 'Challenger', 'Achiever', 'Veteran', 'Master', 'Legend'];

export function levelInfo(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const start = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return {
    level,
    start,
    next,
    progress: (xp - start) / (next - start),
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
  };
}

export async function getTotalXp(db: SQLiteDatabase) {
  const r = await db.getFirstAsync<{ t: number }>('SELECT COALESCE(SUM(amount), 0) AS t FROM xp_events');
  return r?.t ?? 0;
}

export async function awardXp(db: SQLiteDatabase, key: string, amount: number) {
  const ex = await db.getFirstAsync('SELECT id FROM xp_events WHERE reason = ?', key);
  if (ex) return false;
  await db.runAsync('INSERT INTO xp_events (amount, reason) VALUES (?, ?)', amount, key);
  return true;
}

export function revokeXp(db: SQLiteDatabase, key: string) {
  return db.runAsync('DELETE FROM xp_events WHERE reason = ?', key);
}

type Stats = { tasks: number; bestStreak: number; focusSec: number; level: number };

export type BadgeDef = { id: string; icon: string; name: string; desc: string; test: (s: Stats) => boolean };

export const BADGES: BadgeDef[] = [
  { id: 'first_task', icon: '🌱', name: 'First Step', desc: 'Complete your first task', test: (s) => s.tasks >= 1 },
  { id: 'tasks_10', icon: '🔟', name: 'Getting Rolling', desc: 'Complete 10 tasks', test: (s) => s.tasks >= 10 },
  { id: 'tasks_50', icon: '🏆', name: 'Task Crusher', desc: 'Complete 50 tasks', test: (s) => s.tasks >= 50 },
  { id: 'streak_3', icon: '🔥', name: 'On Fire', desc: '3-day habit streak', test: (s) => s.bestStreak >= 3 },
  { id: 'streak_7', icon: '🌟', name: 'Week Warrior', desc: '7-day habit streak', test: (s) => s.bestStreak >= 7 },
  { id: 'focus_first', icon: '🎯', name: 'Locked In', desc: 'Log your first focus session', test: (s) => s.focusSec >= 60 },
  { id: 'focus_hour', icon: '⏱️', name: 'Deep Hour', desc: 'Focus for 1 hour total', test: (s) => s.focusSec >= 3600 },
  { id: 'focus_10h', icon: '🧠', name: 'Deep Worker', desc: 'Focus for 10 hours total', test: (s) => s.focusSec >= 36000 },
  { id: 'level_5', icon: '👑', name: 'Level 5', desc: 'Reach level 5', test: (s) => s.level >= 5 },
];

async function getStats(db: SQLiteDatabase): Promise<Stats> {
  const t = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM tasks WHERE completed_at IS NOT NULL');
  const f = await db.getFirstAsync<{ s: number }>('SELECT COALESCE(SUM(seconds), 0) AS s FROM time_logs');
  const rows = await db.getAllAsync<{ habit_id: number; day: string }>('SELECT habit_id, day FROM habit_logs');
  const map: Record<number, Set<string>> = {};
  for (const r of rows) (map[r.habit_id] ??= new Set()).add(r.day);
  const today = todayStr();
  let bestStreak = 0;
  for (const set of Object.values(map)) bestStreak = Math.max(bestStreak, calcStreak(set, today).best);
  const xp = await getTotalXp(db);
  return { tasks: t?.c ?? 0, bestStreak, focusSec: f?.s ?? 0, level: levelInfo(xp).level };
}

export async function getEarnedBadges(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM badges');
  return new Set(rows.map((r) => r.id));
}

export async function checkBadges(db: SQLiteDatabase) {
  const earned = await getEarnedBadges(db);
  const stats = await getStats(db);
  const fresh: BadgeDef[] = [];
  for (const b of BADGES) {
    if (!earned.has(b.id) && b.test(stats)) {
      await db.runAsync('INSERT OR IGNORE INTO badges (id) VALUES (?)', b.id);
      fresh.push(b);
    }
  }
  return fresh;
}