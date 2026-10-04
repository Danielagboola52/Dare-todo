import { useColorScheme } from 'react-native';
import { useSettings } from '@/store/settings';
import { palettes } from './colors';

export function useTheme() {
  const system = useColorScheme();
  const mode = useSettings((s) => s.themeMode);
  const scheme = mode === 'system' ? (system ?? 'light') : mode;
  return { scheme, colors: palettes[scheme], isDark: scheme === 'dark' };
}