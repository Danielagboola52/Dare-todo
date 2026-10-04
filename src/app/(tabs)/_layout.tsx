import { migrateDb } from '@/db/migrate';
import { setupNotifications } from '@/lib/notify';
import { useTheme } from '@/theme/useTheme';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

export default function RootLayout() {
  const { isDark } = useTheme();
  useEffect(() => { setupNotifications(); }, []);
  return (
    <SQLiteProvider databaseName="daretodo.db" onInit={migrateDb}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </SQLiteProvider>
  );
}