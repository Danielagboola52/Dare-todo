import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const screens: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'sunny' },
  { name: 'tasks', title: 'Tasks', icon: 'list' },
  { name: 'focus', title: 'Focus', icon: 'timer' },
  { name: 'habits', title: 'Habits', icon: 'flame' },
  { name: 'stats', title: 'Stats', icon: 'stats-chart' },
  { name: 'profile', title: 'Profile', icon: 'person' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      {screens.map((s) => (
        <Tabs.Screen
          key={s.name}
          name={s.name}
          options={{
            title: s.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={s.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}