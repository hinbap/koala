import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { mix } from '../lib/color';
import { DayRecord } from '../lib/history';
import { DAY_FULL, MONTHS } from '../lib/alarms';
import { ThemedText } from './ui/ThemedText';

interface Props {
  year: number;
  month: number;
  records: DayRecord[];
  selectedDay: number | null;
  onSelect: (day: number) => void;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Month calendar; each day is shaded from soft (all missed) to accent (all solved). */
export function WakeUpHeatmap({ year, month, records, selectedDay, onSelect }: Props) {
  const t = useTheme();
  const shade = (f: number) => mix(t.soft, t.accent, f);
  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const slots: (DayRecord | null)[] = [...Array(lead).fill(null), ...records];
  while (slots.length % 7) slots.push(null);
  const weeks: (DayRecord | null)[][] = [];
  for (let i = 0; i < slots.length; i += 7) weeks.push(slots.slice(i, i + 7));

  return (
    <View style={styles.wrap}>
      <View style={styles.week} importantForAccessibility="no-hide-descendants">
        {WEEKDAYS.map((w, i) => (
          <ThemedText key={i} caption tone="muted" style={styles.weekday}>
            {w}
          </ThemedText>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.week}>
          {week.map((rec, di) => {
            if (!rec) return <View key={di} style={styles.slot} />;
            const total = rec.results.length;
            const ok = rec.results.filter((r) => r.solved).length;
            const f = total ? ok / total : 0;
            const label = `${DAY_FULL[rec.weekday]}, ${MONTHS[month]} ${rec.day}`;
            let bg = 'transparent', fg = t.muted, borderColor = 'transparent', borderStyle: 'solid' | 'dashed' = 'solid', a11y = label;
            if (rec.future) { fg = t.fur; borderColor = t.thin; a11y += ', upcoming'; }
            else if (!total) { borderColor = t.line; borderStyle = 'dashed'; a11y += ', no alarms'; }
            else { bg = shade(f); fg = f >= 0.5 ? t.onAccent : t.muted; a11y += `, ${ok} of ${total} alarms solved`; }
            const selected = selectedDay === rec.day;
            return (
              <View key={di} style={[styles.slot, selected && { borderColor: t.ink, borderWidth: 2, borderRadius: t.def.radiusSmall + 2, padding: 1 }]}>
                <Pressable
                  disabled={rec.future}
                  onPress={() => onSelect(rec.day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: rec.future }}
                  accessibilityLabel={a11y}
                  style={[styles.day, { backgroundColor: bg, borderColor, borderStyle, borderRadius: t.def.radiusSmall }]}
                >
                  <ThemedText size={11} weight={500} color={fg}>
                    {String(rec.day)}
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
      <View style={styles.legend}>
        <ThemedText size={12} tone="muted">Missed</ThemedText>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <View key={f} style={[styles.legendSwatch, { backgroundColor: shade(f), borderRadius: t.def.radiusSmall }]} />
        ))}
        <ThemedText size={12} tone="muted">All solved</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  week: { flexDirection: 'row', gap: 6 },
  weekday: { flex: 1, textAlign: 'center' },
  slot: { flex: 1, height: 44 },
  day: { flex: 1, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 3 },
  legend: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  legendSwatch: { width: 16, height: 16 },
});
