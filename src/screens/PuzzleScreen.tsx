import React, { useEffect, useRef } from 'react';
import { router, usePreventRemove } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { MONO_FONT } from '../theme/themes';
import { useStore } from '../state/AppStore';
import * as Sudoku from '../lib/sudoku';
import { formatClock } from '../lib/alarms';
import { ThemedText } from '../components/ui/ThemedText';
import { IconButton } from '../components/ui/IconButton';
import { SudokuBoard } from '../components/sudoku/SudokuBoard';
import { PuzzleToolbar } from '../components/sudoku/PuzzleToolbar';
import { NumberPad } from '../components/sudoku/NumberPad';

export function PuzzleScreen() {
  const t = useTheme();
  const { mode, toggleMode } = useThemeControls();
  const insets = useSafeAreaInsets();
  const { puzzle, updatePuzzle, newGame, ringing, settings, startRinging, finishRinging } = useStore();
  const solved = Sudoku.isSolved(puzzle);
  const clock = formatClock(puzzle.seconds);
  const initialized = useRef(false);

  // Direct links start a session too; navigating to settings preserves the puzzle.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!ringing) startRinging();
  }, [ringing, startRinging]);
  usePreventRemove(Boolean(ringing) && settings.lockWhileRinging && !solved);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]} bounces={false}>
        <View style={styles.nav}>
          <ThemedText caption tone="alarm" numberOfLines={1} style={styles.ringing}>
            {ringing ? `Ringing · ${ringing.time} · ${ringing.label}` : ''}
          </ThemedText>
          <View style={styles.navActions}>
            <IconButton
              icon={mode === 'dark' ? 'sun' : 'moon'}
              label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              color={t.muted}
              onPress={toggleMode}
            />
            <IconButton icon="gear" label="Settings" color={t.muted} onPress={() => router.navigate({ pathname: '/settings', params: { from: 'puzzle' } })} />
          </View>
        </View>

        <View style={styles.statusRow}>
          <Pressable
            onPress={newGame}
            accessibilityRole="button"
            style={[styles.newGame, { borderColor: t.line, borderRadius: t.def.radius }]}
          >
            <ThemedText weight={500} size={14} tone="muted">New game</ThemedText>
          </Pressable>
          <ThemedText face="display" size={32} lineHeight={40} accessibilityLabel={`Time spent solving, ${clock}`} style={{ fontVariant: ['tabular-nums'] }}>
            {clock}
          </ThemedText>
        </View>

        <SudokuBoard
          puzzle={puzzle}
          showMistakes={settings.showMistakes}
          onSelect={(i) => updatePuzzle((p) => ({ ...p, selected: i }))}
        />

        <PuzzleToolbar
          notesOn={puzzle.pencil}
          hintsLeft={puzzle.hintsLeft}
          onUndo={() => updatePuzzle(Sudoku.undo)}
          onErase={() => updatePuzzle((p) => Sudoku.enterDigit(p, 0))}
          onToggleNotes={() => updatePuzzle((p) => ({ ...p, pencil: !p.pencil }))}
          onHint={() => updatePuzzle(Sudoku.giveHint)}
        />

        <NumberPad
          counts={Sudoku.digitCounts(puzzle)}
          notesOn={puzzle.pencil}
          onPress={(d) => updatePuzzle((p) => Sudoku.enterDigit(p, d))}
        />

        <Pressable onPress={() => router.navigate('/excuse')} accessibilityRole="button" style={styles.excuse}>
          <ThemedText size={13} tone="muted" style={{ fontFamily: MONO_FONT, letterSpacing: 0.26 }}>
            Excuses excuses...
          </ThemedText>
        </Pressable>
      </ScrollView>

      {solved && (
        <View style={[StyleSheet.absoluteFill, styles.solved, { backgroundColor: t.paper }]}>
          <ThemedText face="display" size={32} lineHeight={40} accessibilityRole="header">
            Good morning.
          </ThemedText>
          <ThemedText tone="muted" lineHeight={24}>{`Solved in ${clock}. The alarm is off.`}</ThemedText>
          <Pressable
            onPress={finishRinging}
            accessibilityRole="button"
            style={[styles.done, { backgroundColor: t.accent, borderRadius: t.def.radius }]}
          >
            <ThemedText weight={500} size={14} tone="onAccent">Back to alarms</ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 22 },
  nav: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  ringing: { flexShrink: 1 },
  navActions: { flexDirection: 'row', gap: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  newGame: { height: 36, paddingHorizontal: 16, borderWidth: 1, justifyContent: 'center' },
  excuse: { alignSelf: 'center', minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  solved: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  done: { marginTop: 16, height: 48, paddingHorizontal: 24, justifyContent: 'center' },
});
