import { router, useIsFocused } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { pad2 } from '../lib/alarms';
import { ThemedText } from '../components/ui/ThemedText';
import { IconButton } from '../components/ui/IconButton';
import { Icon } from '../components/ui/Icon';
import { VoiceWaves } from '../components/VoiceWaves';

/**
 * "Excuses excuses..." — a voice call with an AI agent. UI only: wire `recording`
 * to expo-audio (or your voice-agent SDK) to capture and send the excuse.
 */
export function ExcuseScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/puzzle');
  const [recording, setRecording] = useState(true);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!recording || !focused) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording, focused]);

  const clock = `${pad2(Math.floor(seconds / 3600))}:${pad2(Math.floor(seconds / 60) % 60)}:${pad2(seconds % 60)}`;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.nav}>
        <IconButton icon="chevron-left" label="Back to the puzzle" color={t.ink} strokeWidth={1.6} onPress={goBack} />
      </View>

      <View style={styles.top}>
        <ThemedText face="display" size={52} lineHeight={60} style={{ fontVariant: ['tabular-nums'], letterSpacing: 1 }}>
          {clock}
        </ThemedText>
        <ThemedText size={14} lineHeight={20} tone="muted">
          Voice preview · your microphone is off.
        </ThemedText>
      </View>

      <View style={styles.waves}>
        <VoiceWaves running={recording && focused} />
      </View>

      <View style={styles.bottom}>
        <ThemedText size={15} tone="muted" accessibilityLiveRegion="polite">
          {recording ? 'Preview playing…' : 'Preview paused.'}
        </ThemedText>
        <Pressable
          onPress={() => {
            if (!recording) setSeconds(0);
            setRecording(!recording);
          }}
          accessibilityRole="button"
          accessibilityLabel={recording ? 'Pause voice preview' : 'Play voice preview'}
          style={[
            styles.record,
            recording ? { backgroundColor: t.accent } : { borderWidth: 1, borderColor: t.line },
          ]}
        >
          <Icon name={recording ? 'stop' : 'mic'} size={recording ? 22 : 24} color={recording ? t.onAccent : t.ink} strokeWidth={1.6} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  nav: { paddingHorizontal: 8, paddingTop: 8, height: 52, justifyContent: 'center' },
  top: { paddingTop: 40, paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  waves: { marginTop: 72 },
  bottom: { marginTop: 'auto', paddingBottom: 56, alignItems: 'center', gap: 24 },
  record: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
