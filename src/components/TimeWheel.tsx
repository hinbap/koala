import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollViewInstance, StyleSheet, View } from 'react-native';
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
  // contentOffset must stay fixed: changing it during a drag resets native scrolling.
  const [initialOffset] = useState(() => ({ x: 0, y: (middle + index) * ROW }));
  const initialY = initialOffset.y;

  const [scrollY] = useState(() => new Animated.Value(initialY));
  const scroller = useRef<ScrollViewInstance>(null);
  const center = useRef(middle + index);
  const lastY = useRef(initialY);
  const dragging = useRef(false);
  const momentum = useRef(false);
  const positioned = useRef(false);
  const onIndexRef = useRef(onIndex);
  useEffect(() => { onIndexRef.current = onIndex; }, [onIndex]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const rowAt = useCallback((y: number) => Math.max(0, Math.min(rowCount - 1, Math.round(y / ROW))), [rowCount]);

  // Report the label in the band as soon as it changes, so Save always stores what's on screen.
  const reported = useRef(index);
  const report = useCallback((row: number) => {
    const i = row % n;
    if (i === reported.current) return;
    reported.current = i;
    onIndexRef.current(i);
  }, [n]);

  const settle = useCallback((y: number) => {
    const row = rowAt(y);
    report(row);
    // Jump back to the middle copy so a looping column never runs out of rows.
    const target = loop ? middle + (row % n) : row;
    center.current = target;
    if (target !== row) {
      lastY.current = target * ROW;
      scroller.current?.scrollTo({ y: target * ROW, animated: false });
    }
    else if (Math.abs(y - row * ROW) > 0.5) scroller.current?.scrollTo({ y: row * ROW, animated: true });
  }, [rowAt, report, loop, middle, n]);

  const scheduleSettle = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!dragging.current && !momentum.current) settle(lastY.current);
    }, SETTLE_MS);
  }, [settle]);

  // Track position on every platform; web has no reliable momentum-end event.
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      lastY.current = value;
      const row = rowAt(value);
      center.current = row;
      report(row);
      if (Platform.OS === 'web') scheduleSettle();
    });
    return () => scrollY.removeListener(id);
  }, [scrollY, rowAt, report, scheduleSettle]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: Platform.OS !== 'web' }),
    [scrollY],
  );

  const rows = useMemo(
    () =>
      Array.from({ length: rowCount }, (_, row) => {
        const at = row * ROW;
        const inputRange = [at - 2 * ROW, at - ROW, at, at + ROW, at + 2 * ROW];
        return (
          <Animated.View key={row} style={[styles.cell, {
            opacity: scrollY.interpolate({ inputRange, outputRange: [0.25, 0.5, 1, 0.5, 0.25], extrapolate: 'clamp' }),
            transform: [{ scale: scrollY.interpolate({ inputRange, outputRange: [0.68, 0.8, 1, 0.8, 0.68], extrapolate: 'clamp' }) }],
          }]}>
            <ThemedText face="display" weight={500} size={28}>{labels[row % n]}</ThemedText>
          </Animated.View>
        );
      }),
    [labels, n, rowCount, scrollY],
  );

  // Screen-reader increment and decrement scroll the column one row; the scroll listener reports it.
  const step = (dir: number) => {
    const target = loop ? middle + ((center.current + dir + n) % n) : Math.max(0, Math.min(n - 1, center.current + dir));
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
        contentOffset={initialOffset}
        onLayout={() => {
          if (positioned.current) return;
          positioned.current = true;
          scroller.current?.scrollTo({ y: initialY, animated: false });
        }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          clearTimeout(timer.current);
          momentum.current = false;
          dragging.current = true;
        }}
        onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          dragging.current = false;
          lastY.current = e.nativeEvent.contentOffset.y;
          scheduleSettle();
        }}
        onMomentumScrollBegin={() => {
          // Web may omit momentum-end; its scroll-idle debounce owns settling.
          if (Platform.OS !== 'web') {
            momentum.current = true;
            clearTimeout(timer.current);
          }
        }}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          momentum.current = false;
          clearTimeout(timer.current);
          settle(e.nativeEvent.contentOffset.y);
        }}
      >
        {rows}
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
