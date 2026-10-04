import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayStr } from '@/lib/date';

// Returns today's local date and updates it after midnight or when the app resumes.
export function useToday() {
  const [today, setToday] = useState(todayStr());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setToday(todayStr());
    });
    const id = setInterval(() => setToday(todayStr()), 60000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);
  return today;
}