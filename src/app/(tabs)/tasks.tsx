import { useCallback, useState } from 'react';
import { Pressable, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { useToday } from '@/hooks/useToday';
import { todayStr } from '@/lib/date';
import { getTasks, setTaskDone, type Task } from '@/db/tasks';
import { TaskCard } from '@/components/TaskCard';
import { AddTaskModal } from '@/components/AddTaskModal';
import { Chip } from '@/components/Chip';

type Filter = 'all' | 'high' | 'low';
type Section = { key: string; title: string; data: Task[] };

const contexts = [
  { key: 'urgent', title: '🔥 Urgent' },
  { key: 'work', title: '💼 Work' },
  { key: 'home', title: '🏠 Home' },
];

export default function Tasks() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const today = useToday();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => setTasks(await getTasks(db)), [db]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = tasks.filter((t) => !t.completed_at && (filter === 'all' || t.energy === filter));
  const sections: Section[] = contexts
    .map((c) => ({ key: c.key, title: c.title, data: open.filter((t) => t.context === c.key) }))
    .filter((s) => s.data.length > 0);

  const doneToday = tasks.filter((t) => t.completed_at && todayStr(new Date(t.completed_at)) === today);
  if (doneToday.length) sections.push({ key: 'done', title: '✅ Done today', data: doneToday });

  async function toggle(t: Task) {
    await setTaskDone(db, t.id, !t.completed_at);
    load();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Tasks</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 6 }}>
          <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="⚡ High energy" active={filter === 'high'} onPress={() => setFilter('high')} />
          <Chip label="🌙 Low energy" active={filter === 'low'} onPress={() => setFilter('low')} />
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <Text style={{ color: colors.subtext, textAlign: 'center', marginTop: 60 }}>
            Nothing here yet. Tap + to add your first task.
          </Text>
        }
        renderSectionHeader={({ section }) => (
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 10 }}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            today={today}
            onToggle={() => toggle(item)}
            onOpen={() => router.push(`/task/${item.id}`)}
          />
        )}
      />

      <Pressable
        onPress={() => setAdding(true)}
        style={{
          position: 'absolute', right: 24, bottom: 24, width: 60, height: 60, borderRadius: 30,
          backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6,
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>

      <AddTaskModal visible={adding} today={today} onClose={() => setAdding(false)} onAdded={load} />
    </SafeAreaView>
  );
}