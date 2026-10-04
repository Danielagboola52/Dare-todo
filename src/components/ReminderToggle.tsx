import { setDailyReminders } from '@/lib/notify';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/useTheme';
import { Switch, Text, View } from 'react-native';

export function ReminderToggle() {
  const { colors } = useTheme();
  const on = useSettings((s) => s.reminders);
  const setOn = useSettings((s) => s.setReminders);

  async function change(v: boolean) {
    const ok = await setDailyReminders(v);
    setOn(v && ok);
  }

  return (
    <View
      style={{
        marginTop: 24, padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: colors.text }}>Daily reminders</Text>
        <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 2 }}>
          8:00 AM pick your top 3  •  8:00 PM check habits
        </Text>
      </View>
      <Switch value={on} onValueChange={change} trackColor={{ true: colors.primary, false: colors.border }} />
    </View>
  );
}