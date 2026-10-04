import type { SQLiteDatabase } from 'expo-sqlite';
import { reward, unreward } from '@/lib/rewards';

export type Priority = 'high' | 'medium' | 'low';
export type Context = 'work' | 'home' | 'urgent';
export type Energy = 'high' | 'low' | null;

export type Task = {
  id: number;
  title: string;
  notes: string | null;
  priority: Priority;
  context: Context;
  energy: Energy;
  due_date: string | null;
  today_rank: number | null;
  rank_date: string | null;
  completed_at: string | null;
  sub_total: number;
  sub_done: number;
};

export type Subtask = { id: number; task_id: number; title: string; done: number };

export function getTasks(db: SQLiteDatabase) {
  return db.getAllAsync<Task>(`
    SELECT t.*,
      (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id) AS sub_total,
      (SELECT COALESCE(SUM(done), 0) FROM subtasks s WHERE s.task_id = t.id) AS sub_done
    FROM tasks t
    ORDER BY
      CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      t.id DESC
  `);
}

export function getTask(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Task>('SELECT *, 0 AS sub_total, 0 AS sub_done FROM tasks WHERE id = ?', id);
}

export function addTask(
  db: SQLiteDatabase,
  t: { title: string; priority: Priority; context: Context; energy: Energy },
  today: string
) {
  return db.runAsync(
    'INSERT INTO tasks (title, priority, context, energy, due_date) VALUES (?, ?, ?, ?, ?)',
    t.title, t.priority, t.context, t.energy, today
  );
}

export async function setTaskDone(db: SQLiteDatabase, id: number, done: boolean) {
    await db.runAsync(
      'UPDATE tasks SET completed_at = ? WHERE id = ?',
      done ? new Date().toISOString() : null, id
    );
    if (done) {
      const t = await db.getFirstAsync<{ priority: Priority }>('SELECT priority FROM tasks WHERE id = ?', id);
      const xp = { high: 30, medium: 20, low: 10 }[t?.priority ?? 'medium'];
      await reward(db, `task:${id}`, xp);
    } else {
      await unreward(db, `task:${id}`);
    }
  }