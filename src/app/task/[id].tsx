import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTimer } from '@/store/timer';
import { useNow } from '@/hooks/useNow';
import { finishTimer } from '@/lib/timer';
import { getTaskSeconds } from '@/db/timeLogs';
import { fmtClock, fmtDuration } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';
import {
  addSubtask, deleteSubtask, deleteTask, getSubtasks, getTask, setSubtaskDone,
  type Subtask, type Task,
} from '@/db/tasks';

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = Number(id);
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [task, setTask] = useState<Task | null>(null);
  const [subs, setSubs] = useState<Subtask[]>([]);
  const [text, setText] = useState('');
  const [logged, setLogged] = useState(0);
  const active = useTimer((s) => s.active);
  const startTimer = useTimer((s) => s.start);
  const now = useNow();
  const running = active?.kind === 'timer' && active.taskId === taskId;

  const load = useCallback(async () => {
    setTask(await getTask(db, taskId));
    setSubs(await getSubtasks(db, taskId));
    setLogged(await getTaskSeconds(db, taskId));
  }, [db, taskId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function add() {
    if (!text.trim()) return;
    await addSubtask(db, taskId, text.trim());
    setText('');
    load();
  }

  async function startStop() {
    if (running) {
      await finishTimer(db);
      load();
    } else {
      await finishTimer(db); // stop any other running timer first
      startTimer({ kind: 'timer', phase: 'focus', taskId, startedAt: Date.now(), durationSec: null });
    }
  }

  function confirmDelete() {
    Alert.alert('Delete task?', 'This also deletes its steps.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteTask(db, taskId); router.back(); },
      },
    ]);
  }

  if (!task) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20, flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <Pressable onPress={confirmDelete} hitSlop={10}>
            <Ionicons name="trash-outline" size={24} color={colors.danger} />
          </Pressable>
        </View>

        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 16 }}>{task.title}</Text>

        <Pressable
          onPress={startStop}
          style={{
            marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: 14, borderRadius: 14, backgroundColor: running ? colors.danger : colors.primary,
          }}
        >
          <Ionicons name={running ? 'stop' : 'play'} size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            {running ? `Stop  •  ${fmtClock((now - active!.startedAt) / 1000)}` : 'Start Timer'}
          </Text>
        </Pressable>
        <Text style={{ marginTop: 8, color: colors.subtext }}>Total time logged: {fmtDuration(logged)}</Text>

        <Text style={{ marginTop: 20, marginBottom: 10, color: colors.subtext, fontWeight: '600' }}>
          Break it into steps
        </Text>

        <FlatList
          data={subs}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8,
                backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
              }}
            >
              <Pressable
                hitSlop={10}
                onPress={async () => { await setSubtaskDone(db, item.id, !item.done); load(); }}
              >
                <Ionicons
                  name={item.done ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={item.done ? colors.accent : colors.subtext}
                />
              </Pressable>
              <Text
                style={{
                  flex: 1, color: colors.text, fontSize: 15,
                  textDecorationLine: item.done ? 'line-through' : 'none',
                }}
              >
                {item.title}
              </Text>
              <Pressable
                hitSlop={10}
                onPress={async () => { await deleteSubtask(db, item.id); load(); }}
              >
                <Ionicons name="close" size={20} color={colors.subtext} />
              </Pressable>
            </View>
          )}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={add}
            placeholder="Add a step"
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