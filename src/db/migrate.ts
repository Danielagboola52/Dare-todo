import { type SQLiteDatabase } from 'expo-sqlite';

const LATEST_VERSION = 1;

export async function migrateDb(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= LATEST_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        notes TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',  -- high | medium | low
        context TEXT NOT NULL DEFAULT 'work',     -- work | home | urgent
        energy TEXT,                              -- high | low | NULL
        today_rank INTEGER,                       -- 1..3 for Today screen, NULL otherwise
        rank_date TEXT,                           -- the day that rank applies to, YYYY-MM-DD
        due_date TEXT,                            -- YYYY-MM-DD
        completed_at TEXT,                        -- ISO timestamp
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE subtasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE habit_logs (
        habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        day TEXT NOT NULL,                        -- local date YYYY-MM-DD
        PRIMARY KEY (habit_id, day)
      );

      CREATE TABLE time_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        kind TEXT NOT NULL,                       -- pomodoro | timer
        started_at TEXT NOT NULL,
        seconds INTEGER NOT NULL
      );

      CREATE TABLE xp_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE badges (
        id TEXT PRIMARY KEY,
        earned_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    version = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${LATEST_VERSION}`);
}