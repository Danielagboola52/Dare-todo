import { Chip } from '@/components/Chip';
import { getTasks, type Task } from '@/db/tasks';
import { getTodayFocusSeconds } from '@/db/timeLogs';
import { useNow } from '@/hooks/useNow';
import { useToday } from '@/hooks/useToday';
import { fmtClock, fmtDuration } from '@/lib/format';
import { schedulePomodoroAlert } from '@/lib/notify';
import { finishTimer } from '@/lib/timer';
import { useTimer } from '@/store/timer';
import { useTheme } from '@/theme/useTheme';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OPTIONS = [1, 15, 25, 50];

export default function Focus() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const today = useToday();
  const now = useNow();
  const active = useTimer((s) => s.active);
  const start = useTimer((s) => s.start);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [minutes, setMinutes] = useState(25);
  const [todaySecs, setTodaySecs] = useState(0);

  const load = useCallback(async () => {
    setTasks((await getTasks(db)).filter((t) => !t.completed_at));
    setTodaySecs(await getTodayFocusSeconds(db, today));
  }, [db, today]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pomo = active?.kind === 'pomodoro' ? active : null;
  const elapsed = pomo ? Math.floor((now - pomo.startedAt) / 1000) : 0;
  const remaining = pomo ? Math.max(0, pomo.durationSec! - elapsed) : minutes * 60;

  // When a countdown ends: log it, then start a break (or end the break).
  useEffect(() => {
    if (!pomo || remaining > 0) return;
    const wasFocus = pomo.phase === 'focus';
    const taskForBreak = pomo.taskId;
    const focusMin = Math.round(pomo.durationSec! / 60);
    Vibration.vibrate([0, 400, 200, 400]);
    finishTimer(db).then(() => {
      if (wasFocus) {
        const breakSec = (focusMin >= 50 ? 10 : 5) * 60;
        start({
          kind: 'pomodoro', phase: 'break', taskId: taskForBreak,
          startedAt: Date.now(), durationSec: breakSec,
        });
        schedulePomodoroAlert(breakSec, 'Break over ⏰', 'Ready for the next focus session?');
      }
      load();
    });
  }, [remaining, pomo, db, start, load]);

  const selected = tasks.find((t) => t.id === (pomo ? pomo.taskId : taskId));
  const btn = (label: string, onPress: () => void, primary = true) => (
    <Pressable
      onPress={onPress}
      style={{
        marginTop: 28, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 30,
        backgroundColor: primary ? colors.primary : colors.card,
        borderWidth: 1, borderColor: primary ? colors.primary : colors.border,
      }}
    >
      <Text style={{ fontWeight: '800', fontSize: 16, color: primary ? '#fff' : colors.text }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Focus</Text>
        <Text style={{ color: colors.subtext, marginTop: 4 }}>Today: {fmtDuration(todaySecs)} focused</Text>

        {active?.kind === 'timer' ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ color: colors.subtext, textAlign: 'center' }}>
              A task timer is running ({fmtClock((now - active.startedAt) / 1000)}).
            </Text>
            {btn('Stop task timer', () => finishTimer(db).then(load), false)}
          </View>
        ) : (
          <>
            {!pomo && (
              <>
                <Text style={{ marginTop: 20, marginBottom: 8, color: colors.subtext, fontWeight: '600' }}>Length</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {OPTIONS.map((m) => (
                    <Chip key={m} label={`${m} min`} active={minutes === m} onPress={() => setMinutes(m)} />
                  ))}
                </View>
                <Text style={{ marginTop: 20, marginBottom: 8, color: colors.subtext, fontWeight: '600' }}>Working on</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <Chip label="No task" active={taskId === null} onPress={() => setTaskId(null)} />
                  {tasks.map((t) => (
                    <Chip key={t.id} label={t.title} active={taskId === t.id} onPress={() => setTaskId(t.id)} />
                  ))}
                </ScrollView>
              </>
            )}

            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: colors.subtext, fontWeight: '700', letterSpacing: 1 }}>
                {pomo ? (pomo.phase === 'focus' ? 'FOCUS' : 'BREAK') : 'READY'}
              </Text>
              <Text style={{ fontSize: 72, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] }}>
                {fmtClock(remaining)}
              </Text>
              {selected && <Text style={{ color: colors.subtext }}>{selected.title}</Text>}

              {!pomo &&
                btn('Start focus', () => {
                  start({
                    kind: 'pomodoro', phase: 'focus', taskId,
                    startedAt: Date.now(), durationSec: minutes * 60,
                  });
                  schedulePomodoroAlert(minutes * 60, 'Focus session done 🎯', 'Nice work. Time for a break.');
                })}
              {pomo && btn(pomo.phase === 'focus' ? 'Stop & save' : 'Skip break', () => finishTimer(db).then(load), false)}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}