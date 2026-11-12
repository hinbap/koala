import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from './ThemedText';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** Equal-width outlined choices; the selected one takes the accent tint. */
export function ChoiceGroup<T extends string>({ options, value, onChange, label }: Props<T>) {
  const t = useTheme();
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[
              styles.option,
              { borderRadius: t.def.radius, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.soft : 'transparent' },
            ]}
          >
            <ThemedText weight={500} size={14} tone={on ? 'accent' : 'muted'}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, height: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
