import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemedText } from './ThemedText';
import { Icon } from './Icon';

interface Props<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Field showing the current choice; tapping it expands the options in place. */
export function Dropdown<T extends string>({ label, value, options, onChange }: Props<T>) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? value;

  return (
    <View style={[styles.wrap, { borderBottomColor: t.line }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        style={styles.trigger}
      >
        <ThemedText lineHeight={24}>{label}</ThemedText>
        <View style={styles.current}>
          <ThemedText tone="muted">{current}</ThemedText>
          <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
            <Icon name="chevron-right" size={16} color={t.muted} strokeWidth={1.6} />
          </View>
        </View>
      </Pressable>
      {open && options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => { onChange(o.value); setOpen(false); }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={styles.option}
          >
            <ThemedText tone={on ? 'accent' : 'muted'}>{o.label}</ThemedText>
            {on && <Icon name="check" size={16} color={t.accent} strokeWidth={1.6} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: 1 },
  trigger: { minHeight: 52, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  current: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  option: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 4 },
});
