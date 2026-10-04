import { Alert } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { awardXp, checkBadges, getTotalXp, levelInfo, revokeXp } from '@/db/xp';

export async function reward(db: SQLiteDatabase, key: string, amount: number) {
  const before = levelInfo(await getTotalXp(db)).level;
  await awardXp(db, key, amount);
  const after = levelInfo(await getTotalXp(db)).level;
  const badges = await checkBadges(db);

  const lines: string[] = [];
  if (after > before) lines.push(`⬆️ Level ${after} reached!`);
  badges.forEach((b) => lines.push(`${b.icon} Badge: ${b.name}`));
  if (lines.length) Alert.alert('Nice work!', lines.join('\n'));
}

export function unreward(db: SQLiteDatabase, key: string) {
  return revokeXp(db, key);
}