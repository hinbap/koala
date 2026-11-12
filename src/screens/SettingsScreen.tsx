import React from 'react';
import { Slider } from '@expo/ui/community/slider';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Mode, THEME_ORDER, THEMES } from '../theme/themes';
import { Settings, useStore } from '../state/AppStore';
import { useAlarmNotifications } from '../state/AlarmNotifications';
import { Level, LEVELS } from '../lib/alarms';
import { ALARM_VOLUMES, AlarmSoundId, SOUND_OPTIONS } from '../lib/sounds';
import { ThemedText } from '../components/ui/ThemedText';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ChoiceGroup } from '../components/ui/ChoiceGroup';
import { Dropdown } from '../components/ui/Dropdown';
import { Toggle } from '../components/ui/Toggle';
import { ThemeCard } from '../components/ThemeCard';

const BACK_LABEL: Record<string, string> = { puzzle: 'Puzzle', wakeups: 'Wake-ups', alarms: 'Alarms' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText caption tone="muted" accessibilityRole="header">{title}</ThemedText>
      <View style={{ borderTopWidth: 1, borderTopColor: t.line }}>{children}</View>
    </View>
  );
}

function Row({ label, sub, right, below }: { label: string; sub?: string; right?: React.ReactNode; below?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: t.line }]}>
      <View style={styles.rowTop}>
        <View style={styles.rowText}>
          <ThemedText lineHeight={24}>{label}</ThemedText>
          {sub ? <ThemedText size={14} lineHeight={20} tone="muted">{sub}</ThemedText> : null}
        </View>
        {right}
      </View>
      {below}
    </View>
  );
}

export function SettingsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { themeId, setThemeId, mode, setMode, storageError: themeStorageError } = useThemeControls();
  const { settings, updateSettings, alarmActive, storageError } = useStore();
  const notifications = useAlarmNotifications();
  const matchedVolumeIndex = ALARM_VOLUMES.findIndex((volume) => volume.value === settings.alarmVolume);
  const volumeIndex = matchedVolumeIndex < 0 ? ALARM_VOLUMES.length - 1 : matchedVolumeIndex;
  const selectedVolume = ALARM_VOLUMES[volumeIndex];

  const { from } = useLocalSearchParams<{ from?: string }>();
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/');

  const toggleRow = (key: keyof Settings, label: string, sub?: string, disabled = false) => (
    <Row
      label={label}
      sub={sub}
      right={<Toggle value={settings[key] as boolean} onChange={(v) => updateSettings({ [key]: v } as Partial<Settings>)} label={label} disabled={disabled} />}
    />
  );

  const stepButton = (label: string, delta: number, text: string) => (
    <Pressable
      onPress={() => updateSettings({ hintsPerPuzzle: Math.min(9, Math.max(0, settings.hintsPerPuzzle + delta)) })}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.step, { borderColor: t.line, borderRadius: t.def.radius }]}
    >
      <ThemedText size={18}>{text}</ThemedText>
    </Pressable>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Settings" backLabel={BACK_LABEL[from ?? 'alarms'] ?? 'Alarms'} onBack={goBack} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {(storageError || themeStorageError) && <ThemedText tone="alarm" accessibilityRole="alert">{storageError || themeStorageError}</ThemedText>}
        <View style={styles.section}>
          <ThemedText caption tone="muted" accessibilityRole="header">Appearance</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={160}
            decelerationRate="fast"
            style={styles.carousel}
            contentContainerStyle={styles.carouselContent}
            accessibilityRole="radiogroup"
            accessibilityLabel="Theme"
          >
            {THEME_ORDER.map((id) => (
              <ThemeCard key={id} def={THEMES[id]} mode={mode} selected={themeId === id} onPress={() => setThemeId(id)} />
            ))}
          </ScrollView>
          <View style={styles.modeRow}>
            <ThemedText lineHeight={24}>Mode</ThemedText>
            <View style={{ width: 200 }}>
              <ChoiceGroup<Mode>
                label="Mode"
                value={mode}
                onChange={setMode}
                options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
              />
            </View>
          </View>
        </View>

        <Section title="Puzzle">
          <Row
            label="Default difficulty"
            sub="Used for new alarms. Each game generates a fresh puzzle at its selected difficulty."
            below={
              <ChoiceGroup<Level>
                label="Default difficulty"
                value={settings.defaultLevel}
                onChange={(defaultLevel) => updateSettings({ defaultLevel })}
                options={LEVELS.map((l) => ({ value: l, label: l }))}
              />
            }
          />
          <Row
            label="Hints per puzzle"
            sub="Applies to the next puzzle you start."
            right={
              <View style={styles.stepper} accessibilityLabel={`Hints per puzzle, ${settings.hintsPerPuzzle}`}>
                {stepButton('Fewer hints', -1, '−')}
                <ThemedText face="display" size={20} style={styles.stepValue}>{String(settings.hintsPerPuzzle)}</ThemedText>
                {stepButton('More hints', 1, '+')}
              </View>
            }
          />
          {toggleRow('showMistakes', 'Show mistakes', 'Mark a wrong number as soon as it’s entered.')}
        </Section>

        <Section title="Wake-up">
          <Row label="Alarm notifications" sub={notifications.message} below={Platform.OS !== 'web' ? (
            <Pressable accessibilityRole="button" disabled={notifications.busy} onPress={() => void notifications.enable()} style={[styles.permissionButton, { borderColor: t.line, borderRadius: t.def.radius }]}>
              <ThemedText tone="accent">{notifications.busy ? 'Checking permissions…' : 'Enable / manage permissions'}</ThemedText>
            </Pressable>
          ) : undefined} />
          {notifications.error && <ThemedText tone="alarm" accessibilityRole="alert">{notifications.error}</ThemedText>}
          {alarmActive && <ThemedText size={14} tone="muted">Solve the ringing puzzle to change playback and safety settings.</ThemedText>}
          {toggleRow('volumeClimbsBack', 'Volume climbs back', 'After a move, the sound softens. After 30 seconds without another move, it returns to your chosen volume.', alarmActive)}
          {toggleRow('overridePhoneVolume', 'Play in silent mode', 'Allows in-app audio through the iOS silent switch. Does not change system volume or override Focus or notification settings.', alarmActive || Platform.OS !== 'ios')}
          {toggleRow('vibrate', 'Vibrate', 'Vibrate while ringing in the mobile app. iOS notification vibration follows system settings.', alarmActive || Platform.OS === 'web')}
          <Row
            label="Alarm volume"
            sub="In-app playback volume. Locked until the ringing puzzle is solved. Notification volume follows system settings."
            right={<ThemedText tone="accent">{selectedVolume.label}</ThemedText>}
            below={
              <View>
                <Slider
                  disabled={alarmActive}
                  accessibilityLabel={`Alarm volume, ${selectedVolume.label}`}
                  minimumValue={0}
                  maximumValue={ALARM_VOLUMES.length - 1}
                  step={1}
                  value={volumeIndex}
                  onValueChange={(value) => {
                    const index = Math.max(0, Math.min(ALARM_VOLUMES.length - 1, Math.round(value)));
                    updateSettings({ alarmVolume: ALARM_VOLUMES[index].value });
                  }}
                  minimumTrackTintColor={t.accent}
                  maximumTrackTintColor={t.line}
                  thumbTintColor={t.accent}
                  style={styles.volumeSlider}
                />
                <View style={styles.volumeLabels}>
                  {ALARM_VOLUMES.map((volume) => (
                    <ThemedText key={volume.value} size={12} tone="muted">{volume.label}</ThemedText>
                  ))}
                </View>
              </View>
            }
          />
          <Dropdown<AlarmSoundId>
            label="Default sound"
            value={settings.defaultSound}
            options={SOUND_OPTIONS}
            onChange={(defaultSound) => updateSettings({ defaultSound })}
          />
        </Section>

        <Section title="Safety net">
          {toggleRow('backupAlarm', 'Backup alarm', 'Once a puzzle starts ringing, repeat a notification every minute until solved, even after closing the app. Requires notification permission.', alarmActive || Platform.OS === 'web')}
          {toggleRow('lockWhileRinging', 'Lock while ringing', 'Block leaving the puzzle and adding, editing, disabling, or deleting alarms until solved.', alarmActive)}
        </Section>

        <Section title="About">
          <Row label="Version" right={<ThemedText tone="muted">{Constants.expoConfig?.version ?? '1.0.0'}</ThemedText>} />
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, gap: 32 },
  section: { gap: 8 },
  carousel: { marginHorizontal: -16 },
  carouselContent: { paddingHorizontal: 16, gap: 12, paddingVertical: 4 },
  modeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  row: { paddingVertical: 12, minHeight: 56, gap: 12, justifyContent: 'center', borderBottomWidth: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  rowText: { flexShrink: 1, gap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  step: { width: 44, height: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 32, textAlign: 'center' },
  volumeSlider: { width: '100%', minHeight: 44, margin: 0 },
  volumeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  permissionButton: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', alignSelf: 'flex-start', borderWidth: 1 },
});
