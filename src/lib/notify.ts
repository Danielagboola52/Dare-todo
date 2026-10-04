import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNEL = 'default';

export async function setupNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Reminders & timers',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

export async function schedulePomodoroAlert(seconds: number, title: string, body: string) {
  if (seconds < 1) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: 'pomodoro-end',
      content: { title, body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: CHANNEL,
      },
    });
  } catch {}
}

export async function cancelPomodoroAlert() {
  try {
    await Notifications.cancelScheduledNotificationAsync('pomodoro-end');
  } catch {}
}

export async function setDailyReminders(on: boolean) {
  try {
    await Notifications.cancelScheduledNotificationAsync('reminder-morning');
    await Notifications.cancelScheduledNotificationAsync('reminder-evening');
    if (!on) return true;
    if (!(await setupNotifications())) return false;

    await Notifications.scheduleNotificationAsync({
      identifier: 'reminder-morning',
      content: { title: 'Good morning ☀️', body: 'Pick your top 3 for today.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 8, minute: 0, channelId: CHANNEL },
    });
    await Notifications.scheduleNotificationAsync({
      identifier: 'reminder-evening',
      content: { title: 'Evening check-in 🌙', body: 'Tick off your habits and finish what you can.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0, channelId: CHANNEL },
    });
    return true;
  } catch {
    return false;
  }
}