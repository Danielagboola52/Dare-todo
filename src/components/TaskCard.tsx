import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import type { Task } from '@/db/tasks';

const priorityColor = { high: '#E17055', medium: '#FDCB6E', low: '#74B9FF' };

export function TaskCard({
  task, today, onToggle, onOpen,
}: { task: Task; today: string; onToggle: () => void; onOpen: () => void }) {
  const { colors } = useTheme();
  const done = !!task.completed_at;
  const carried = !done && !!task.due_date && task.due_date < today;

  return (
    <Pressable
      onPress={onOpen}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10,
        backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
        opacity: done ? 0.55 : 1,
      }}
    >
      <Pressable onPress={onToggle} hitSlop={10}>
        <Ionicons
          name={done ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={done ? colors.accent : colors.subtext}
        />
      </Pressable>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16, fontWeight: '600', color: colors.text,
            textDecorationLine: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: priorityColor[task.priority] }} />
          {task.energy && (
            <Text style={{ fontSize: 12, color: colors.subtext }}>
              {task.energy === 'high' ? '⚡ High energy' : '🌙 Low energy'}
            </Text>
          )}
          {task.sub_total > 0 && (
            <Text style={{ fontSize: 12, color: colors.subtext }}>
              {task.sub_done}/{task.sub_total} steps
            </Text>
          )}
          {carried && (
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.danger }}>↩ Carried over</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}