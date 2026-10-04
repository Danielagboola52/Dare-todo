import { ReminderToggle } from '@/components/ReminderToggle';
import { BADGES, getEarnedBadges, getTotalXp, levelInfo } from '@/db/xp';
import { useSettings, type ThemeMode } from '@/store/settings';
import { useTheme } from '@/theme/useTheme';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const modes: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Day' },
  { key: 'dark', label: 'Night' },
];

export default function Profile() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { themeMode, setThemeMode } = useSettings();
  const [xp, setXp] = useState(0);
  const [earned, setEarned] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setXp(await getTotalXp(db));
        setEarned(await getEarnedBadges(db));
      })();
    }, [db])
  );

  const info = levelInfo(xp);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Profile</Text>

        <View
          style={{
            marginTop: 20, padding: 20, borderRadius: 18, backgroundColor: colors.card,
            borderWidth: 1, borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.subtext, fontWeight: '700', letterSpacing: 1 }}>{info.title.toUpperCase()}</Text>
          <Text style={{ fontSize: 40, fontWeight: '800', color: colors.primary }}>Level {info.level}</Text>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: colors.border, marginTop: 10, overflow: 'hidden' }}>
            <View
              style={{
                height: 12, width: `${Math.round(info.progress * 100)}%`, backgroundColor: colors.accent,
              }}
            />
          </View>
          <Text style={{ color: colors.subtext, marginTop: 8 }}>
            {xp} XP  •  {info.next - xp} XP to level {info.level + 1}
          </Text>
        </View>

        <Text style={{ marginTop: 24, marginBottom: 10, color: colors.subtext, fontWeight: '600' }}>
          Badges ({earned.size}/{BADGES.length})
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {BADGES.map((b) => {
            const has = earned.has(b.id);
            return (
              <View
                key={b.id}
                style={{
                  width: '48%', padding: 14, borderRadius: 14, backgroundColor: colors.card,
                  borderWidth: 1, borderColor: colors.border, opacity: has ? 1 : 0.4,
                }}
              >
                <Text style={{ fontSize: 28 }}>{has ? b.icon : '🔒'}</Text>
                <Text style={{ fontWeight: '700', color: colors.text, marginTop: 4 }}>{b.name}</Text>
                <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 2 }}>{b.desc}</Text>
              </View>
            );
          })}
        </View>

        <ReminderToggle />

        <Text style={{ marginTop: 24, marginBottom: 10, color: colors.subtext }}>Appearance</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {modes.map((m) => {
            const active = themeMode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setThemeMode(m.key)}
                style={{
                  flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
                  backgroundColor: active ? colors.primary : colors.card,
                  borderWidth: 1, borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text style={{ fontWeight: '700', color: active ? '#fff' : colors.text }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}