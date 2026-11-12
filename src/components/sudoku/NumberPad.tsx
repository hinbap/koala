import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from '../ui/ThemedText';

interface Props {
  /** counts[d] = how many of digit d are on the board. */
  counts: number[];
  activeDigit: number | null;
  notesOn: boolean;
  onPress: (digit: number) => void;
}

/** 1–5 on the first row, 6–9 centred on the second. Digits fade once all nine are placed. */
export function NumberPad({ counts, activeDigit, notesOn, onPress }: Props) {
  const t = useTheme();
  const outlined = t.def.outlinedKeys;
  const key = (d: number) => {
    const done = counts[d] >= 9;
    const selected = activeDigit === d;
    return (
      <Pressable
        key={d}
        onPress={() => onPress(d)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${notesOn ? 'note ' : ''}${d}, ${Math.max(0, 9 - counts[d])} left`}
        accessibilityHint={selected ? 'Switch to inspecting cells without editing.' : 'Highlights matching numbers. Tap an editable cell to use this number.'}
        style={({ pressed }) => [
          styles.key,
          {
            borderRadius: t.def.radius,
            backgroundColor: selected ? t.accent : outlined ? 'transparent' : t.surface,
            borderWidth: outlined ? 1 : 0,
            borderColor: selected ? t.accent : t.line,
          },
          pressed && { opacity: 0.75 },
        ]}
      >
        <ThemedText face="display" size={26} color={selected ? t.onAccent : done ? t.fur : t.ink}>
          {String(d)}
        </ThemedText>
      </Pressable>
    );
  };
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>{[1, 2, 3, 4, 5].map(key)}</View>
      <View style={styles.row}>{[6, 7, 8, 9].map(key)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  key: { flexBasis: 44, flexGrow: 1, maxWidth: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
