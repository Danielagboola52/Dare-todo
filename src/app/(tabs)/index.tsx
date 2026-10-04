import { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { useToday } from '@/hooks/useToday';
import { getTasks, pinTask, setTaskDone, unpinTask, type Task } from '@/db/tasks';
import { TaskCard } from '@/components/TaskCard';

export default function Today() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const today = useToday();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [picking, setPicking] = useState(false);

  const load = useCallback(async () => setTasks(await getTasks(db)), [db]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const top = tasks
    .filter((t) => t.today_rank != null && t.rank_date === today)
    .sort((a, b) => a.today_rank! - b.today_rank!);
  const pinnedIds = new Set(top.map((t) => t.id));
  const candidates = tasks.filter((t) => !t.completed_at && !pinnedIds.has(t.id));
  const carried = tasks.filter((t) => !t.completed_at && t.due_date && t.due_date < today).length;
  const doneCount = top.filter((t) => t.completed_at).length;

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  async function toggle(t: Task) { await setTaskDone(db, t.id, !t.completed_at); load(); }
  async function pick(t: Task) { await pinTask(db, t.id, today); setPicking(false); load(); }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: colors.subtext, fontWeight: '600' }}>{dateLabel}</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 }}>Top 3 today</Text>
        <Text style={{ color: colors.subtext, marginTop: 4 }}>
          {doneCount}/3 done{carried > 0 ? `  •  ${carried} carried over in Tasks` : ''}
        </Text>

        <View style={{ marginTop: 20 }}>
          {[1, 2, 3].map((rank) => {
            const t = top.find((x) => x.today_rank === rank);
            return (
              <View key={rank} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary, width: 24 }}>{rank}</Text>
                {t ? (
                  <View style={{ flex: 1 }}>
                    <TaskCard task={t} today={today} onToggle={() => toggle(t)} onOpen={() => router.push(`/task/${t.id}`)} />
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setPicking(true)}
                    style={{
                      flex: 1, padding: 18, marginBottom: 10, borderRadius: 14, borderWidth: 1.5,
                      borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.subtext, fontWeight: '600' }}>+ Pick a task</Text>
                  </Pressable>
                )}
                {t && (
                  <Pressable
                    hitSlop={10}
                    style={{ marginBottom: 10 }}
                    onPress={async () => { await unpinTask(db, t.id); load(); }}
                  >
                    <Ionicons name="close" size={20} color={colors.subtext} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <Modal visible={picking} animationType="slide" transparent onRequestClose={() => setPicking(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setPicking(false)} />
          <View style={{ maxHeight: '70%', backgroundColor: colors.bg, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 12 }}>Choose a task</Text>
            <FlatList
              data={candidates}
              keyExtractor={(t) => String(t.id)}
              ListEmptyComponent={
                <Text style={{ color: colors.subtext, textAlign: 'center', padding: 20 }}>
                  No open tasks. Add some in the Tasks tab first.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => pick(item)}
                  style={{
                    padding: 14, marginBottom: 8, borderRadius: 12, backgroundColor: colors.card,
                    borderWidth: 1, borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{item.title}</Text>
                  <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2 }}>
                    {item.priority} • {item.context}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}