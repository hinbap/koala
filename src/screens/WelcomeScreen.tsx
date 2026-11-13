import React, { useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../state/AuthProvider';
import { keyframes, useLoop, useReduceMotion } from '../hooks/useLoop';
import { ThemedText } from '../components/ui/ThemedText';
import { Icon } from '../components/ui/Icon';
import { BotScene, ClockScene, StreakScene, SudokuScene } from '../components/welcome/WelcomeScenes';

interface Page {
  title: string;
  body: string;
  alt: string;
  Scene: React.ComponentType;
}

export const WELCOME_PAGES: Page[] = [
  {
    title: 'Meet your new nemesis.',
    body: 'An alarm so annoying you’ll wake up just to delete it. You won’t. You know you need it.',
    alt: 'A koala lies flat on its back under a ringing alarm clock, glaring and pointing up at it.',
    Scene: ClockScene,
  },
  {
    title: 'Sudoku or it keeps ringing.',
    body: 'Solve the puzzle to turn it off. Keep making moves to soften the sound.',
    alt: 'A koala peeks out from behind a sudoku grid, tapping a pencil at the square being filled.',
    Scene: SudokuScene,
  },
  {
    title: 'Got an excuse?',
    body: 'Meet the excuse-bot preview. Voice conversations are coming later; for now, the puzzle gets you up.',
    alt: 'A koala hangs upside down from a branch, talking at a robot that squints back, unconvinced.',
    Scene: BotScene,
  },
  {
    title: 'Shame works.',
    body: 'Explore the wake-up chart preview. Personal history and friends are coming later.',
    alt: 'A koala sprawls across the top of a streak chart, one paw dangling at your empty square.',
    Scene: StreakScene,
  },
];

export function WelcomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { finishWelcome } = useAuth();
  const [page, setPage] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));
  const nudge = useLoop(1800);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) { fade.setValue(1); return; }
    fade.setValue(0);
    const animation = Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [page, fade, reduceMotion]);

  const last = WELCOME_PAGES.length - 1;
  const go = (p: number) => p >= 0 && p <= last && setPage(p);

  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderRelease: (_, g) => {
          if (g.dx < -50) setPage(current => Math.min(last, current + 1));
          else if (g.dx > 50) setPage(current => Math.max(0, current - 1));
        },
      }),
    [last],
  );

  const { title, body, alt, Scene } = WELCOME_PAGES[page];
  const enter = { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] };

  return (
    <ScrollView {...swipe.panHandlers} contentContainerStyle={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 28 }]}>
      <View style={styles.nav}>
        <ThemedText caption tone="muted">{`${page + 1} / ${WELCOME_PAGES.length}`}</ThemedText>
        <Pressable onPress={finishWelcome} accessibilityRole="button" style={styles.textButton}>
          <ThemedText size={15} weight={500} tone="muted">Skip</ThemedText>
        </Pressable>
      </View>

      <Animated.View key={page} style={[styles.stage, enter]} accessible accessibilityRole="image" accessibilityLabel={alt}>
        <Scene />
      </Animated.View>

      <Animated.View style={[styles.copy, enter]} accessibilityLiveRegion="polite">
        <ThemedText face="display" size={34} lineHeight={40} accessibilityRole="header">{title}</ThemedText>
        <ThemedText size={17} lineHeight={26} tone="muted">{body}</ThemedText>
      </Animated.View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => go(page - 1)}
          disabled={page === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityElementsHidden={page === 0}
          style={[styles.back, page === 0 && styles.hidden]}
        >
          <Icon name="chevron-left" color={t.ink} strokeWidth={1.8} />
        </Pressable>

        <View style={styles.dots} accessibilityRole="tablist">
          {WELCOME_PAGES.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => go(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: i === page }}
              accessibilityLabel={`Page ${i + 1} of ${WELCOME_PAGES.length}`}
              style={styles.dotHit}
            >
              <View style={[styles.dot, { width: i === page ? 22 : 6, backgroundColor: i === page ? t.accent : t.line }]} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => (page === last ? finishWelcome() : go(page + 1))}
          accessibilityRole="button"
          accessibilityLabel={page === last ? 'Sign in' : 'Next page'}
          style={({ pressed }) => [styles.next, pressed && { opacity: 0.6 }]}
        >
          <ThemedText weight={600}>{page === last ? 'Sign in' : 'Next'}</ThemedText>
          <Animated.View style={{ transform: [{ translateX: keyframes(nudge, [[0, 0], [0.5, 6], [1, 0]]) }] }}>
            <Icon name="arrow-right" size={20} color={t.ink} strokeWidth={1.8} />
          </Animated.View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, paddingHorizontal: 24 },
  nav: { height: 48, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textButton: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center' },
  stage: { marginTop: 40 },
  copy: { marginTop: 36, minHeight: 150, gap: 12 },
  footer: { marginTop: 'auto', paddingTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
  dots: { flexDirection: 'row', gap: 4 },
  dotHit: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 6, borderRadius: 3 },
  next: { minHeight: 44, paddingLeft: 8, paddingRight: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
});
