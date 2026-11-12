import React, { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../state/AppStore';
import { formatCountdown, formatTime, minutesOfDay, nextAlarm } from '../lib/alarms';
import { ThemedText } from '../components/ui/ThemedText';
import { IconButton } from '../components/ui/IconButton';
import { Icon } from '../components/ui/Icon';
import { SleepingKoala } from '../components/SleepingKoala';
import { SwipeableAlarmRow } from '../components/SwipeableAlarmRow';
import { AlarmDraft, AlarmEditorSheet } from '../components/AlarmEditorSheet';

export function AlarmsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { alarms, settings, saveAlarm, deleteAlarm, toggleAlarm, ringing, startRinging } = useStore();
  const [draft, setDraft] = useState<AlarmDraft | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const sorted = useMemo(() => [...alarms].sort((a, b) => minutesOfDay(a) - minutesOfDay(b)), [alarms]);
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(useCallback(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []));
  const next = nextAlarm(alarms, now);

  const newDraft = (): AlarmDraft => ({
    id: null, hour: 7, minute: 0, meridiem: 'AM', label: 'Alarm',
    days: [false, false, false, false, false, false, false], level: settings.defaultLevel, on: true,
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText face="display" size={32} lineHeight={40} accessibilityRole="header">
          Alarms
        </ThemedText>
        <View style={styles.actions}>
          <IconButton icon="grid" label="Wake-up history" color={t.ink} onPress={() => router.navigate('/wakeups')} />
          <IconButton icon="gear" label="Settings" color={t.ink} onPress={() => router.navigate('/settings')} />
          <IconButton icon="plus" label="Add alarm" color={t.accent} size={24} strokeWidth={1.6} onPress={() => { setOpenRow(null); setDraft(newDraft()); }} />
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroText}>
          <ThemedText caption tone="muted">Next alarm</ThemedText>
          {next ? (
            <>
              <View style={styles.heroTime}>
                <ThemedText face="display" weight={t.def.displayWeight === 500 ? 400 : 300} size={64} lineHeight={76} style={{ letterSpacing: -1.5, flexShrink: 1 }} numberOfLines={1} adjustsFontSizeToFit>
                  {formatTime(next.alarm)}
                </ThemedText>
                <ThemedText tone="muted">{next.alarm.meridiem}</ThemedText>
              </View>
              <ThemedText tone="muted" lineHeight={24}>
                {`${next.alarm.label} — in ${formatCountdown(next.minutes)}`}
              </ThemedText>
            </>
          ) : (
            <ThemedText face="display" tone="muted" style={{ fontStyle: 'italic' }}>
              Nothing set. Sleep in.
            </ThemedText>
          )}
        </View>
        <Pressable onPress={startRinging} accessibilityRole="button" accessibilityLabel="Wake the koala: test the alarm">
          <SleepingKoala />
        </Pressable>
      </View>

      <ThemedText size={12} tone="muted" style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        Demo mode · alarms are not scheduled.
      </ThemedText>

      <ScrollView style={{ borderTopWidth: 1, borderTopColor: t.line }} contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
        {sorted.map((a) => (
          <SwipeableAlarmRow
            key={a.id}
            alarm={a}
            open={openRow === a.id}
            onOpenChange={(o) => setOpenRow(o ? a.id : null)}
            onEdit={() => { setOpenRow(null); setDraft({ ...a, days: [...a.days] }); }}
            onToggle={() => toggleAlarm(a.id)}
            onDelete={() => { setOpenRow(null); deleteAlarm(a.id); }}
          />
        ))}
      </ScrollView>

      <Pressable
        onPress={startRinging}
        accessibilityRole="button"
        style={({ pressed }) => [styles.fab, { bottom: 28 + insets.bottom, backgroundColor: t.accent, opacity: pressed ? 0.85 : 1 }]}
      >
        <Icon name="sudoku" size={16} color={t.onAccent} strokeWidth={1.6} />
        <ThemedText weight={500} size={14} tone="onAccent">{ringing ? 'Resume sudoku' : 'Play sudoku'}</ThemedText>
      </Pressable>

      {draft && <AlarmEditorSheet
        draft={draft}
        onCancel={() => setDraft(null)}
        onSave={(d) => { saveAlarm(d); setDraft(null); }}
        onDelete={(id) => { deleteAlarm(id); setDraft(null); }}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 4 },
  hero: { paddingHorizontal: 16, paddingVertical: 32, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  heroText: { flex: 1, minWidth: 0, gap: 8 },
  heroTime: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  fab: {
    position: 'absolute', alignSelf: 'center', height: 44, paddingHorizontal: 18, borderRadius: 22,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
});
