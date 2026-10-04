import { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';

// Loaded safely: in plain Expo Go the native module doesn't exist.
let Speech: any = null;
try {
  Speech = require('expo-speech-recognition');
} catch {}

function Mic({ onText }: { onText: (t: string) => void }) {
  const { colors } = useTheme();
  const [listening, setListening] = useState(false);
  const { ExpoSpeechRecognitionModule: Mod, useSpeechRecognitionEvent: useEvent } = Speech;

  useEvent('start', () => setListening(true));
  useEvent('end', () => setListening(false));
  useEvent('result', (e: any) => {
    const t = e.results?.[0]?.transcript;
    if (t) onText(t);
  });
  useEvent('error', (e: any) => {
    setListening(false);
    if (e.error !== 'no-speech' && e.error !== 'aborted') Alert.alert('Voice error', e.message ?? e.error);
  });

  async function toggle() {
    if (listening) { Mod.stop(); return; }
    const p = await Mod.requestPermissionsAsync();
    if (!p.granted) { Alert.alert('Microphone needed', 'Allow microphone access in Settings.'); return; }
    Mod.start({ lang: 'en-US', interimResults: true });
  }

  return (
    <Pressable
      onPress={toggle}
      style={{
        width: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: listening ? colors.danger : colors.card,
        borderWidth: 1, borderColor: listening ? colors.danger : colors.border,
      }}
    >
      <Ionicons name={listening ? 'stop' : 'mic'} size={24} color={listening ? '#fff' : colors.primary} />
    </Pressable>
  );
}

export function VoiceButton({ onText }: { onText: (t: string) => void }) {
  return Speech ? <Mic onText={onText} /> : null;
}