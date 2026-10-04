import type { SQLiteDatabase } from 'expo-sqlite';
import { reward, unreward } from '@/lib/rewards';

export type Habit = { id: number; title: string };

export function getHabits(db: SQLiteDatabase) {
  return db.getAllAsync<Habit>('SELECT id, title FROM habits ORDER BY id');
}

export async function getLogs(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ habit_id: number; day: string }>('SELECT habit_id, day FROM habit_logs');
  const map: Record<number, Set<string>> = {};
  for (const r of rows) (map[r.habit_id] ??= new Set()).add(r.day);
  return map;
}

export function addHabit(db: SQLiteDatabase, title: string) {
  return db.runAsync('INSERT INTO habits (title) VALUES (?)', title);
}

export function deleteHabit(db: SQLiteDatabase, id: number) {
  return db.runAsync('DELETE FROM habits WHERE id = ?', id);
}

export async function setHabitDay(db: SQLiteDatabase, id: number, day: string, done: boolean) {
    if (done) {
      await db.runAsync('INSERT OR IGNORE INTO habit_logs (habit_id, day) VALUES (?, ?)', id, day);
      await reward(db, `habit:${id}:${day}`, 10);
    } else {
      await db.runAsync('DELETE FROM habit_logs WHERE habit_id = ? AND day = ?', id, day);
      await unreward(db, `habit:${id}:${day}`);
    }
  }