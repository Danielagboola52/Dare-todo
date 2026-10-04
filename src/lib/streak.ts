import { addDays } from './date';

// A streak stays alive if you finished yesterday but haven't ticked today yet.
export function calcStreak(days: Set<string>, today: string) {
  let cursor = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let best = 0, run = 0;
  let prev: string | null = null;
  for (const d of [...days].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best };
}