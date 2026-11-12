import React, { useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Alarm, describeDays, formatTime } from '../lib/alarms';
import { ThemedText } from './ui/ThemedText';
import { Toggle } from './ui/Toggle';

const REVEAL = 96;

interface Props {
  alarm: Alarm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

/** Alarm row: tap to edit, swipe left to reveal Delete. */
export function SwipeableAlarmRow({ alarm, open, onOpenChange, onEdit, onToggle, onDelete, disabled = false }: Props) {
  const t = useTheme();
  const [x] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(x, { toValue: open ? -REVEAL : 0, useNativeDriver: true, bounciness: 0, speed: 18 }).start();
  }, [open, x]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => !disabled && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => {
          const base = open ? -REVEAL : 0;
          x.setValue(Math.max(-REVEAL - 50, Math.min(0, base + g.dx)));
        },
        onPanResponderRelease: (_, g) => {
          const base = open ? -REVEAL : 0;
          const shouldOpen = base + g.dx < -REVEAL / 2;
          onOpenChange(shouldOpen);
          Animated.spring(x, { toValue: shouldOpen ? -REVEAL : 0, useNativeDriver: true, bounciness: 0, speed: 18 }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(x, { toValue: open ? -REVEAL : 0, useNativeDriver: true }).start();
        },
      }),
    [open, onOpenChange, x, disabled],
  );

  const time = formatTime(alarm);
  return (
    <View style={[styles.row, { backgroundColor: t.alarm, borderBottomColor: t.line }]}>
      <Pressable
        onPress={onDelete}
        disabled={disabled}
        style={styles.delete}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${time} ${alarm.meridiem} alarm`}
        importantForAccessibility={open ? 'yes' : 'no-hide-descendants'}
      >
        <ThemedText weight={500} size={14} tone="onAccent">
          Delete
        </ThemedText>
      </Pressable>

      <Animated.View {...pan.panHandlers} style={[styles.front, { backgroundColor: t.paper, transform: [{ translateX: x }] }]}>
        <Pressable
          onPress={() => (open ? onOpenChange(false) : onEdit())}
          disabled={disabled}
          accessibilityState={{ disabled }}
          style={styles.body}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${time} ${alarm.meridiem} alarm, ${alarm.label}`}
          accessibilityActions={[{ name: 'delete', label: 'Delete alarm' }]}
          onAccessibilityAction={(e) => !disabled && e.nativeEvent.actionName === 'delete' && onDelete()}
        >
          <View style={styles.timeLine}>
            <ThemedText face="display" size={32} lineHeight={40} tone={alarm.on ? 'ink' : 'muted'}>
              {time}
            </ThemedText>
            <ThemedText weight={500} size={14} tone="muted">
              {alarm.meridiem}
            </ThemedText>
          </View>
          <ThemedText size={14} lineHeight={20} tone="muted" numberOfLines={1}>
            {`${alarm.label} · ${describeDays(alarm.days)} · Sudoku, ${alarm.level.toLowerCase()}`}
          </ThemedText>
        </Pressable>
        <Toggle value={alarm.on} onChange={onToggle} disabled={disabled} label={`${alarm.on ? 'Turn off' : 'Turn on'} ${time} ${alarm.meridiem} alarm`} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth },
  delete: { position: 'absolute', right: 0, top: 0, bottom: 0, width: REVEAL, alignItems: 'center', justifyContent: 'center' },
  front: { flexDirection: 'row', alignItems: 'center', paddingRight: 16 },
  body: { flex: 1, paddingVertical: 16, paddingLeft: 16, gap: 4 },
  timeLine: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
});
