import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDb } from '@/db/migrate';
import { useTheme } from '@/theme/useTheme';

export default function RootLayout() {
  const { isDark } = useTheme();
  return (
    <SQLiteProvider databaseName="daretodo.db" onInit={migrateDb}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </SQLiteProvider>
  );
}