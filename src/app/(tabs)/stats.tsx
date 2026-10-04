import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/theme/useTheme';
import { useToday } from '@/hooks/useToday';
import { weekdayLetter } from '@/lib/date';
import { fmtDuration } from '@/lib/format';
import { getWeekStats, type WeekStats } from '@/db/stats';

function BarChart({
  title, days, values, color, today, unit = '',
}: { title: string; days: string[]; values: number[]; color: string; today: string; unit?: string }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...values);
  return (
    <View
      style={{
        marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: colors.card,
        borderWidth: 1, borderColor: colors.border,
      }}
    >
      <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 12 }}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 130 }}>
        {values.map((v, i) => (
          <View key={days[i]} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <Text style={{ fontSize: 11, color: colors.subtext, marginBottom: 3 }}>
              {v > 0 ? `${Math.round(v)}${unit}` : ''}
            </Text>
            <View
              style={{
                width: 22, height: Math.max(4, (v / max) * 90), borderRadius: 6,
                backgroundColor: v > 0 ? color : colors.border, opacity: days[i] === today ? 1 : 0.75,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        {days.map((d) => (
          <Text
            key={d}
            style={{
              flex: 1, textAlign: 'center', fontSize: 12,
              color: d === today ? colors.primary : colors.subtext, fontWeight: d === today ? '800' : '400',
            }}
          >
            {weekdayLetter(d)}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function Stats() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const today = useToday();
  const [s, setS] = useState<WeekStats | null>(null);

  useFocusEffect(useCallback(() => { getWeekStats(db, today).then(setS); }, [db, today]));

  const card = (label: string, value: string) => (
    <View
      style={{
        flex: 1, padding: 14, borderRadius: 14, backgroundColor: colors.card,
        borderWidth: 1, borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 2 }}>{label}</Text>
    </View>
  );

  if (!s) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} />;
  const focusTotal = s.focusMinPerDay.reduce((a, b) => a + b, 0) * 60;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Weekly insights</Text>
        <Text style={{ color: colors.subtext, marginTop: 4 }}>Last 7 days</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          {card('Tasks done', String(s.totalCompleted))}
          {card('Completion rate', s.rate === null ? '–' : `${Math.round(s.rate * 100)}%`)}
          {card('Focused', fmtDuration(focusTotal))}
        </View>

        <View
          style={{
            marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: colors.card,
            borderWidth: 1, borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.subtext, fontWeight: '600' }}>Most productive day</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary, marginTop: 4 }}>
            {s.bestWeekday ? `${s.bestWeekday.name}s (${s.bestWeekday.count} tasks done overall)` : 'Finish some tasks to find out'}
          </Text>
        </View>

        <BarChart title="Tasks completed" days={s.days} values={s.completedPerDay} color={colors.primary} today={today} />
        <BarChart title="Focus minutes" days={s.days} values={s.focusMinPerDay} color={colors.accent} today={today} unit="m" />
        <BarChart title="Habit check-ins" days={s.days} values={s.habitChecksPerDay} color={colors.danger} today={today} />
      </ScrollView>
    </SafeAreaView>
  );
}