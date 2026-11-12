import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, ScrollViewInstance, StyleSheet, View } from 'react-native';
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
  onChange: (patch: Partial<Value>) => void;
}

const ROW = 40;
const PAD = ROW * 2; // two rows above and below the centre row
const CYCLES = 5; // looping columns repeat their labels; we stay near the middle copy
const SETTLE_MS = 140;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad2(i));
const MERIDIEMS: Meridiem[] = ['AM', 'PM'];

interface ColumnProps {
  name: string;
  labels: string[];
  index: number;
  loop: boolean;
  onIndex: (index: number) => void;
}

/** One scrolling column. It snaps to a row and reports the centred label once scrolling stops. */
function WheelColumn({ name, labels, index, loop, onIndex }: ColumnProps) {
  const n = labels.length;
  const rowCount = loop ? n * CYCLES : n;
  const middle = loop ? Math.floor(CYCLES / 2) * n : 0;
  const initialY = (middle + index) * ROW;

  const [scrollY] = useState(() => new Animated.Value(initialY));
  const scroller = useRef<ScrollViewInstance>(null);
  const center = useRef(middle + index);
  const lastY = useRef(initialY);
  const dragging = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const rowAt = (y: number) => Math.max(0, Math.min(rowCount - 1, Math.round(y / ROW)));

  // Report the label in the band as soon as it changes, so Save always stores what's on screen.
  const reported = useRef(index);
  const report = (row: number) => {
    const i = row % n;
    if (i === reported.current) return;
    reported.current = i;
    onIndex(i);
  };

  const settle = (y: number) => {
    const row = rowAt(y);
    report(row);
    // Jump back to the middle copy so a looping column never runs out of rows.
    const target = loop ? middle + (row % n) : row;
    center.current = target;
    if (target !== row) scroller.current?.scrollTo({ y: target * ROW, animated: false });
    else if (Math.abs(y - row * ROW) > 0.5) scroller.current?.scrollTo({ y: row * ROW, animated: true });
  };

  const scheduleSettle = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!dragging.current) settle(lastY.current);
    }, SETTLE_MS);
  };

  // Track position on every platform; web has no reliable momentum-end event.
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      lastY.current = value;
      report(rowAt(value));
      scheduleSettle();
    });
    return () => scrollY.removeListener(id);
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true }),
    [scrollY],
  );

  const rows = useMemo(
    () =>
      Array.from({ length: rowCount }, (_, row) => {
        const at = row * ROW;
        const inputRange = [at - 2 * ROW, at - ROW, at, at + ROW, at + 2 * ROW];
        return {
          label: labels[row % n],
          opacity: scrollY.interpolate({ inputRange, outputRange: [0.25, 0.5, 1, 0.5, 0.25], extrapolate: 'clamp' }),
          scale: scrollY.interpolate({ inputRange, outputRange: [0.68, 0.8, 1, 0.8, 0.68], extrapolate: 'clamp' }),
        };
      }),
    [labels, n, rowCount, scrollY],
  );

  // Screen-reader increment and decrement scroll the column one row; the scroll listener reports it.
  const step = (dir: number) => {
    const target = loop ? center.current + dir : Math.max(0, Math.min(n - 1, center.current + dir));
    center.current = target;
    report(target);
    scroller.current?.scrollTo({ y: target * ROW, animated: true });
  };

  return (
    <View
      style={styles.column}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={name}
      accessibilityValue={{ text: labels[index] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      <Animated.ScrollView
        ref={scroller}
        contentOffset={{ x: 0, y: initialY }}
        onLayout={() => scroller.current?.scrollTo({ y: center.current * ROW, animated: false })}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        nestedScrollEnabled
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          dragging.current = true;
        }}
        onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          dragging.current = false;
          lastY.current = e.nativeEvent.contentOffset.y;
          scheduleSettle();
        }}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          clearTimeout(timer.current);
          settle(e.nativeEvent.contentOffset.y);
        }}
      >
        {rows.map((r, row) => (
          <Animated.View key={row} style={[styles.cell, { opacity: r.opacity, transform: [{ scale: r.scale }] }]}>
            <ThemedText face="display" weight={500} size={28}>
              {r.label}
            </ThemedText>
          </Animated.View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

/** iOS-style time picker: scroll each column; the row in the band is selected. */
export function TimeWheel({ value, onChange }: Props) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={[styles.band, { borderColor: t.line }]} />
      <WheelColumn name="Hour" labels={HOURS} loop index={value.hour - 1} onIndex={(i) => onChange({ hour: i + 1 })} />
      <WheelColumn name="Minute" labels={MINUTES} loop index={value.minute} onIndex={(i) => onChange({ minute: i })} />
      <WheelColumn
        name="AM or PM"
        labels={MERIDIEMS}
        loop={false}
        index={value.meridiem === 'AM' ? 0 : 1}
        onIndex={(i) => onChange({ meridiem: MERIDIEMS[i] })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: ROW * 5, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  band: { position: 'absolute', left: 0, right: 0, top: PAD - 2, height: ROW + 4, borderTopWidth: 1, borderBottomWidth: 1 },
  column: { width: 84, height: ROW * 5 },
  content: { paddingVertical: PAD },
  cell: { height: ROW, alignItems: 'center', justifyContent: 'center' },
});
