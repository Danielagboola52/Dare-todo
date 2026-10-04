import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { useToday } from '@/hooks/useToday';
import { addDays, weekdayLetter } from '@/lib/date';
import { calcStreak } from '@/lib/streak';
import { addHabit, deleteHabit, getHabits, getLogs, setHabitDay, type Habit } from '@/db/habits';

export default function Habits() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const today = useToday();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<number, Set<string>>>({});
  const [text, setText] = useState('');

  const load = useCallback(async () => {
    setHabits(await getHabits(db));
    setLogs(await getLogs(db));
  }, [db]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const week = [-6, -5, -4, -3, -2, -1, 0].map((n) => addDays(today, n));
  const doneToday = habits.filter((h) => logs[h.id]?.has(today)).length;

  async function add() {
    if (!text.trim()) return;
    await addHabit(db, text.trim());
    setText('');
    load();
  }

  function confirmDelete(h: Habit) {
    Alert.alert('Delete habit?', `"${h.title}" and its streak will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteHabit(db, h.id); load(); } },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Habits</Text>
        <Text style={{ color: colors.subtext, marginTop: 4, marginBottom: 16 }}>
          {doneToday}/{habits.length} done today
        </Text>

        <FlatList
          data={habits}
          keyExtractor={(h) => String(h.id)}
          ListEmptyComponent={
            <Text style={{ color: colors.subtext, textAlign: 'center', marginTop: 40 }}>
              No habits yet. Add a daily routine below.
            </Text>
          }
          renderItem={({ item }) => {
            const days = logs[item.id] ?? new Set<string>();
            const done = days.has(today);
            const { current, best } = calcStreak(days, today);
            return (
              <Pressable
                onLongPress={() => confirmDelete(item)}
                style={{
                  padding: 14, marginBottom: 10, borderRadius: 14, backgroundColor: colors.card,
                  borderWidth: 1, borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    hitSlop={10}
                    onPress={async () => { await setHabitDay(db, item.id, today, !done); load(); }}
                  >
                    <Ionicons
                      name={done ? 'checkmark-circle' : 'ellipse-outline'}
                      size={30}
                      color={done ? colors.accent : colors.subtext}
                    />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{item.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 2 }}>
                      🔥 {current} day streak  •  best {best}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  {week.map((d) => (
                    <View key={d} style={{ alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 11, color: colors.subtext }}>{weekdayLetter(d)}</Text>
                      <View
                        style={{
                          width: 22, height: 22, borderRadius: 11,
                          backgroundColor: days.has(d) ? colors.accent : 'transparent',
                          borderWidth: 1.5, borderColor: days.has(d) ? colors.accent : colors.border,
                        }}
                      />
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          }}
        />

        <Text style={{ color: colors.subtext, fontSize: 12, marginBottom: 8 }}>Long-press a habit to delete it.</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={add}
            placeholder="New daily habit (e.g. Read 20 pages)"
            placeholderTextColor={colors.subtext}
            style={{
              flex: 1, padding: 14, borderRadius: 12, color: colors.text,
              backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
            }}
          />
          <Pressable
            onPress={add}
            style={{ width: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}