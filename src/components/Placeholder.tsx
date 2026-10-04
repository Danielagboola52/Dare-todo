import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

export function Placeholder({ title, note }: { title: string; note: string }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>{title}</Text>
        <Text style={{ marginTop: 8, color: colors.subtext }}>{note}</Text>
      </View>
    </SafeAreaView>
  );
}