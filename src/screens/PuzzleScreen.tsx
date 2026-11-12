import React, { useEffect, useRef, useState } from 'react';
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
import { DifficultySheet } from '../components/sudoku/DifficultySheet';

export function PuzzleScreen() {
	const t = useTheme();
	const { mode, toggleMode } = useThemeControls();
	const insets = useSafeAreaInsets();
	const { puzzle, updatePuzzle, newGame, ringing, practicing, settings, endSession } = useStore();
	const solved = Sudoku.isSolved(puzzle);
	const clock = formatClock(puzzle.seconds);
	const [showNewGame, setShowNewGame] = useState(false);

	// Only an alarm or a practice session owns this screen; a stray link returns to the alarms.
	const sessionActive = Boolean(ringing) || practicing;
	const initialSession = useRef(sessionActive);
	useEffect(() => {
		if (!initialSession.current) router.replace('/');
	}, []);
	// Settings and other pushed screens keep the puzzle; only a ringing alarm blocks leaving it.
	usePreventRemove(Boolean(ringing) && settings.lockWhileRinging && !solved);

	return (
		<View style={[styles.screen, { paddingTop: insets.top }]}>
			<ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]} bounces={false}>
				<View style={styles.nav}>
					<ThemedText caption tone="alarm" numberOfLines={1} style={styles.ringing}>
						{ringing ? `Ringing · ${ringing.time} · ${ringing.label}` :
							<IconButton icon="stop" label="End sudoku" color={t.muted} onPress={endSession} />}
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
						onPress={() => setShowNewGame(true)}
						accessibilityRole="button"
						style={[styles.newGame, { borderColor: t.line, borderRadius: t.def.radius }]}
					>
						<ThemedText weight={500} size={14} tone="muted">New game</ThemedText>
					</Pressable>
					<View style={styles.gameStatus}>
						<ThemedText caption tone="muted">{puzzle.level}</ThemedText>
						<ThemedText face="display" size={32} lineHeight={40} accessibilityLabel={`Time spent solving, ${clock}`} style={{ fontVariant: ['tabular-nums'] }}>
							{clock}
						</ThemedText>
					</View>
				</View>

				<SudokuBoard
					puzzle={puzzle}
					showMistakes={settings.showMistakes}
					onSelect={(i) => updatePuzzle((p) => Sudoku.tapCell(p, i))}
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
					activeDigit={puzzle.activeDigit}
					notesOn={puzzle.pencil}
					onPress={(d) => updatePuzzle((p) => Sudoku.selectDigit(p, d))}
				/>
				<ThemedText size={12} lineHeight={18} tone="muted" accessibilityLiveRegion="polite" style={styles.inputHelp}>
				</ThemedText>

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
						onPress={endSession}
						accessibilityRole="button"
						style={[styles.done, { backgroundColor: t.accent, borderRadius: t.def.radius }]}
					>
						<ThemedText weight={500} size={14} tone="onAccent">Back to alarms</ThemedText>
					</Pressable>
				</View>
			)}
			{showNewGame && (
				<DifficultySheet
					title="New game"
					description="Starting a new game replaces your current puzzle."
					actionLabel="Start game"
					level={puzzle.level}
					onCancel={() => setShowNewGame(false)}
					onStart={(level) => {
						newGame(level);
						setShowNewGame(false);
					}}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	content: { paddingHorizontal: 16, gap: 16 },
	nav: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
	ringing: { flexShrink: 1 },
	navActions: { flexDirection: 'row', gap: 4 },
	statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	gameStatus: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	inputHelp: { textAlign: 'center' },
	newGame: { height: 36, paddingHorizontal: 16, borderWidth: 1, justifyContent: 'center' },
	excuse: { alignSelf: 'center', minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
	solved: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
	done: { marginTop: 16, height: 48, paddingHorizontal: 24, justifyContent: 'center' },
});
