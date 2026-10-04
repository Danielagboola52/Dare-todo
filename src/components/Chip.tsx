import { Pressable, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: active ? colors.primary : colors.card,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ fontWeight: '600', color: active ? '#fff' : colors.text }}>{label}</Text>
    </Pressable>
  );
}