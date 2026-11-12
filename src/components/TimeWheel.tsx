import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Meridiem, pad2 } from '../lib/alarms';
import { ThemedText } from './ui/ThemedText';

interface Value {
  hour: number;
  minute: number;
  meridiem: Meridiem;
}

interface Props {
  value: Value;
  onChange: (v: Value) => void;
}

type Column = 'hour' | 'minute' | 'meridiem';
const ROW = 40;

function step(v: Value, col: Column, dir: number): Value {
  if (col === 'hour') return { ...v, hour: ((v.hour - 1 + dir + 12) % 12) + 1 };
  if (col === 'minute') return { ...v, minute: (v.minute + dir + 60) % 60 };
  if (dir > 0 && v.meridiem === 'AM') return { ...v, meridiem: 'PM' };
  if (dir < 0 && v.meridiem === 'PM') return { ...v, meridiem: 'AM' };
  return v;
}

function labelAt(v: Value, col: Column, off: number): string {
  if (col === 'hour') return String(((v.hour - 1 + off + 12) % 12) + 1);
  if (col === 'minute') return pad2((v.minute + off + 60) % 60);
  const idx = (v.meridiem === 'AM' ? 0 : 1) + off;
  return idx === 0 ? 'AM' : idx === 1 ? 'PM' : '';
}

/** iOS-style time picker: five visible rows per column; tap a neighbour to step to it. */
export function TimeWheel({ value, onChange }: Props) {
  const t = useTheme();
  const columns: { col: Column; name: string }[] = [
    { col: 'hour', name: 'Hour' },
    { col: 'minute', name: 'Minute' },
    { col: 'meridiem', name: 'AM or PM' },
  ];
  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={[styles.band, { borderColor: t.line }]} />
      {columns.map(({ col, name }) => (
        <View
          key={col}
          style={styles.column}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={name}
          accessibilityValue={{ text: labelAt(value, col, 0) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => onChange(step(value, col, e.nativeEvent.actionName === 'increment' ? 1 : -1))}
        >
          {[-2, -1, 0, 1, 2].map((off) => {
            const text = labelAt(value, col, off);
            const dist = Math.abs(off);
            return (
              <Pressable key={off} disabled={!off || !text} onPress={() => onChange(step(value, col, off))} style={styles.cell}>
                <ThemedText
                  face="display"
                  weight={dist === 0 ? 500 : 300}
                  size={dist === 0 ? 28 : dist === 1 ? 22 : 18}
                  tone={dist === 0 ? 'ink' : 'muted'}
                >
                  {text}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: ROW * 5, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  band: { position: 'absolute', left: 0, right: 0, top: ROW * 2 - 2, height: ROW + 4, borderTopWidth: 1, borderBottomWidth: 1 },
  column: { width: 84 },
  cell: { height: ROW, alignItems: 'center', justifyContent: 'center' },
});
