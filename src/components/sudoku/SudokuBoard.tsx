import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { isGiven, isPeer, matchesActiveDigit, PuzzleState, solutionAt, valueAt } from '../../lib/sudoku';
import { ThemedText } from '../ui/ThemedText';

interface Props {
  puzzle: PuzzleState;
  showMistakes: boolean;
  onSelect: (index: number) => void;
}

/** Matching digits share the accent fill; the inspected cell has an inset outline. */
export const SudokuBoard = memo(function SudokuBoard({ puzzle, showMistakes, onSelect }: Props) {
  const t = useTheme();
  const sel = puzzle.selected;
  const thin = t.thin;
  const box = t.def.boxLineWidth;

  const rows = [];
  for (let r = 0; r < 9; r++) {
    const cells = [];
    for (let c = 0; c < 9; c++) {
      const i = r * 9 + c;
      const v = valueAt(puzzle, i);
      const given = isGiven(puzzle, i);
      const selected = sel === i;
      const matching = matchesActiveDigit(puzzle, i);
      const peer = sel !== null && !selected && isPeer(sel, i);
      const wrong = showMistakes && !given && v !== 0 && v !== solutionAt(puzzle, i);
      const hinted = !given && v !== 0 && !!puzzle.hinted[i] && v === solutionAt(puzzle, i);
      const notes = puzzle.notes[i];

      let bg = peer || selected ? t.soft : t.surface;
      let fg = given ? t.ink : hinted ? t.accent : t.muted;
      if (wrong) fg = t.alarm;
      if (matching) {
        bg = t.accent;
        fg = t.onAccent;
      }

      cells.push(
        <Pressable
          key={i}
          onPress={() => onSelect(i)}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={`Row ${r + 1}, column ${c + 1}, ${v || 'empty'}${given ? ', given' : ''}${wrong ? ', wrong' : ''}${hinted ? ', hint' : ''}${matching ? ', matches selected number' : ''}`}
          accessibilityHint={given || puzzle.activeDigit === null ? 'Inspect this cell.' : `${puzzle.pencil ? 'Toggle note' : 'Place'} ${puzzle.activeDigit} in this cell.`}
          style={[
            styles.cell,
            {
              backgroundColor: bg,
              borderRightWidth: c === 8 ? 0 : c % 3 === 2 ? box : 1,
              borderRightColor: c % 3 === 2 ? t.thick : thin,
              borderBottomWidth: r === 8 ? 0 : r % 3 === 2 ? box : 1,
              borderBottomColor: r % 3 === 2 ? t.thick : thin,
            },
          ]}
        >
          {v === 0 && notes.length > 0 ? (
            <View style={styles.notes}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <ThemedText key={n} size={8} lineHeight={10} tone="muted" style={styles.note}>
                  {notes.includes(n) ? String(n) : ' '}
                </ThemedText>
              ))}
            </View>
          ) : (
            <ThemedText
              face="display"
              weight={given ? 500 : 400}
              size={20}
              color={fg}
              style={
                wrong
                  ? { textDecorationLine: 'underline', textDecorationColor: t.alarm }
                  : hinted
                    ? { textDecorationLine: 'underline', textDecorationStyle: 'dashed', textDecorationColor: t.accent }
                    : undefined
              }
            >
              {v ? String(v) : ''}
            </ThemedText>
          )}
          {selected && <View pointerEvents="none" style={[styles.cursor, { borderColor: matching ? t.onAccent : t.accent }]} />}
        </Pressable>,
      );
    }
    rows.push(
      <View key={r} style={styles.row}>
        {cells}
      </View>,
    );
  }

  return (
    <View
      accessibilityLabel="Sudoku board"
      style={[styles.board, { backgroundColor: t.surface, borderColor: t.thick, borderWidth: box, borderRadius: t.def.radius }]}
    >
      {rows}
    </View>
  );
});


const styles = StyleSheet.create({
  board: { overflow: 'hidden', aspectRatio: 1, width: '100%' },
  row: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cursor: { position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, borderWidth: 1.5 },
  notes: { width: '84%', flexDirection: 'row', flexWrap: 'wrap' },
  note: { width: '33.33%', textAlign: 'center' },
});
