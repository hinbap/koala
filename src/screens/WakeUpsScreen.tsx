import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../state/AppStore';
import { DAY_FULL, formatClock, MONTHS } from '../lib/alarms';
import { sampleMonth, summarize } from '../lib/history';
import { ThemedText } from '../components/ui/ThemedText';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { IconButton } from '../components/ui/IconButton';
import { WakeUpHeatmap } from '../components/WakeUpHeatmap';

export function WakeUpsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { alarms } = useStore();
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const records = useMemo(() => sampleMonth(year, month, today, alarms), [year, month, today, alarms]);
  const stats = summarize(records);
  const isCurrent = year === today.getFullYear() && month === today.getMonth();

  const shift = (dir: number) => {
    let y = year, m = month + dir;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    if (new Date(y, m, 1) > today) return;
    setYear(y);
    setMonth(m);
    setSelectedDay(y === today.getFullYear() && m === today.getMonth() ? today.getDate() : null);
  };

  const sel = selectedDay ? records[selectedDay - 1] : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Wake-ups" backLabel="Alarms" onBack={() => router.canGoBack() ? router.back() : router.replace('/')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <ThemedText size={12} tone="muted">Sample history · not your recorded wake-ups.</ThemedText>
        <View style={styles.monthBar}>
          <IconButton icon="chevron-left" label="Previous month" color={t.ink} strokeWidth={1.6} onPress={() => shift(-1)} />
          <ThemedText face="display" size={20} lineHeight={28} accessibilityRole="header">
            {`${MONTHS[month]} ${year}`}
          </ThemedText>
          <IconButton icon="chevron-right" label="Next month" color={isCurrent ? t.fur : t.ink} strokeWidth={1.6} onPress={() => shift(1)} />
        </View>

        <View style={styles.stats}>
          {[
            { value: `${stats.won}/${stats.mornings}`, label: 'Mornings won' },
            { value: String(stats.streak), label: 'Day streak' },
            { value: stats.avgSolve === null ? '–' : formatClock(stats.avgSolve), label: 'Avg solve' },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <ThemedText face="display" size={28} lineHeight={36}>{s.value}</ThemedText>
              <ThemedText caption tone="muted">{s.label}</ThemedText>
            </View>
          ))}
        </View>

        <WakeUpHeatmap year={year} month={month} records={records} selectedDay={selectedDay} onSelect={setSelectedDay} />

        <View style={styles.detail}>
          <ThemedText caption tone="muted">
            {sel ? `${DAY_FULL[sel.weekday]}, ${MONTHS[month]} ${sel.day}` : 'Pick a day'}
          </ThemedText>
          <View style={{ borderTopWidth: 1, borderTopColor: t.line }}>
            {sel && sel.results.length ? (
              sel.results.map((r) => (
                <View key={r.label + r.time} style={[styles.result, { borderBottomColor: t.line }]}>
                  <View style={styles.inline}>
                    <ThemedText face="display" size={20} lineHeight={28}>{r.time}</ThemedText>
                    <ThemedText size={14} tone="muted">{r.label}</ThemedText>
                  </View>
                  <ThemedText size={14} weight={500} tone={r.solved ? 'accent' : 'alarm'}>
                    {r.solved ? `Solved in ${formatClock(r.solveSeconds)}` : 'Missed'}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText size={14} lineHeight={20} tone="muted" style={{ paddingVertical: 16 }}>
                {sel ? 'No alarms that day.' : 'Tap a day to see each alarm.'}
              </ThemedText>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 24 },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, gap: 2 },
  detail: { gap: 8 },
  result: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1 },
  inline: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
});
