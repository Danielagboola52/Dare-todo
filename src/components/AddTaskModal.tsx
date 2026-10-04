import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/theme/useTheme';
import { Chip } from './Chip';
import { VoiceButton } from './VoiceButton';
import { addTask, type Context, type Energy, type Priority } from '@/db/tasks';

export function AddTaskModal({
  visible, today, onClose, onAdded,
}: { visible: boolean; today: string; onClose: () => void; onAdded: () => void }) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [context, setContext] = useState<Context>('work');
  const [energy, setEnergy] = useState<Energy>(null);

  const label = (t: string) => (
    <Text style={{ marginTop: 16, marginBottom: 8, color: colors.subtext, fontWeight: '600' }}>{t}</Text>
  );

  async function save() {
    if (!title.trim()) return;
    await addTask(db, { title: title.trim(), priority, context, energy }, today);
    setTitle(''); setPriority('medium'); setContext('work'); setEnergy(null);
    onAdded();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: colors.bg, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>New task</Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What needs doing? (or tap the mic)"
              placeholderTextColor={colors.subtext}
              autoFocus
              style={{
                flex: 1, padding: 14, borderRadius: 12, fontSize: 16, color: colors.text,
                backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
              }}
            />
            <VoiceButton onText={setTitle} />
          </View>

          {label('Priority')}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['high', 'medium', 'low'] as Priority[]).map((p) => (
              <Chip key={p} label={p[0].toUpperCase() + p.slice(1)} active={priority === p} onPress={() => setPriority(p)} />
            ))}
          </View>

          {label('Context')}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['work', 'home', 'urgent'] as Context[]).map((c) => (
              <Chip key={c} label={c[0].toUpperCase() + c.slice(1)} active={context === c} onPress={() => setContext(c)} />
            ))}
          </View>

          {label('Energy needed')}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="None" active={energy === null} onPress={() => setEnergy(null)} />
            <Chip label="⚡ High" active={energy === 'high'} onPress={() => setEnergy('high')} />
            <Chip label="🌙 Low" active={energy === 'low'} onPress={() => setEnergy('low')} />
          </View>

          <Pressable
            onPress={save}
            style={{ marginTop: 24, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: colors.primary }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Add task</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}