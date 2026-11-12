import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Mode, THEME_ORDER, THEMES } from '../theme/themes';
import { Settings, useStore } from '../state/AppStore';
import { Level, LEVELS } from '../lib/alarms';
import { AlarmSoundId, AlarmVolume, SOUND_OPTIONS, VOLUME_OPTIONS } from '../lib/sounds';
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
  const { themeId, setThemeId, mode, setMode } = useThemeControls();
  const { settings, updateSettings } = useStore();

  const { from } = useLocalSearchParams<{ from?: string }>();
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/');

  const toggleRow = (key: keyof Settings, label: string, sub?: string) => (
    <Row
      label={label}
      sub={sub}
      right={<Toggle value={settings[key] as boolean} onChange={(v) => updateSettings({ [key]: v } as Partial<Settings>)} label={label} />}
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
          <Row label="Preview settings" sub="Vibration and backup alarms are not active yet." />
          {toggleRow('volumeClimbsBack', 'Volume climbs back', 'If you stop solving for 30 seconds.')}
          {toggleRow('overridePhoneVolume', 'Override phone volume', 'Ring even when the phone is on silent.')}
          {toggleRow('vibrate', 'Vibrate')}
          <Row
            label="Alarm volume"
            sub="Set here only. The ringing alarm cannot be turned up or down."
            below={
              <ChoiceGroup<AlarmVolume>
                label="Alarm volume"
                value={settings.alarmVolume}
                onChange={(alarmVolume) => updateSettings({ alarmVolume })}
                options={VOLUME_OPTIONS}
              />
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
          {toggleRow('backupAlarm', 'Backup alarm', 'Rings again if the app is closed before you solve it.')}
          {toggleRow('lockWhileRinging', 'Lock while ringing', 'No editing or deleting until it’s solved.')}
        </Section>

        <Section title="About">
          <Row label="Version" right={<ThemedText tone="muted">1.0</ThemedText>} />
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
});
