import type { Level } from './alarms';

export const CELLS = 81;
/** Difficulty uses clue density; these are targets, not human-technique ratings. */
export const CLUE_TARGETS: Record<Level, number> = { Easy: 44, Medium: 35, Hard: 28 };
const ALL_DIGITS = 0b1111111110;
const INDICES = Array.from({ length: CELLS }, (_, i) => i);
const rowOf = (i: number) => Math.floor(i / 9);
const columnOf = (i: number) => i % 9;
const boxOf = (i: number) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
const validIndex = (i: number) => Number.isInteger(i) && i >= 0 && i < CELLS;
const validDigit = (d: number) => Number.isInteger(d) && d >= 1 && d <= 9;

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** MRV backtracking, stopping after two solutions when checking uniqueness. */
function solve(givens: readonly number[], limit: number, random?: () => number) {
  const board = [...givens];
  const rows = Array<number>(9).fill(0);
  const columns = Array<number>(9).fill(0);
  const boxes = Array<number>(9).fill(0);
  for (const i of INDICES) {
    if (!board[i]) continue;
    const bit = 1 << board[i];
    rows[rowOf(i)] |= bit;
    columns[columnOf(i)] |= bit;
    boxes[boxOf(i)] |= bit;
  }
  let count = 0;
  let solution: number[] = [];
  let nodes = 0;
  let exhausted = false;

  function search() {
    if (count >= limit || exhausted) return;
    // A costly uniqueness check keeps the clue instead of blocking the UI.
    if (!random && ++nodes > 20000) { exhausted = true; return; }
    let index = -1, choices: number[] = [];
    for (const i of INDICES) {
      if (board[i]) continue;
      const mask = ALL_DIGITS & ~(rows[rowOf(i)] | columns[columnOf(i)] | boxes[boxOf(i)]);
      if (!mask) return;
      const digits = [];
      for (let d = 1; d <= 9; d++) if (mask & (1 << d)) digits.push(d);
      if (index < 0 || digits.length < choices.length) {
        index = i;
        choices = digits;
        if (digits.length === 1) break;
      }
    }
    if (index < 0) {
      count++;
      if (count === 1) solution = [...board];
      return;
    }
    const r = rowOf(index), c = columnOf(index), b = boxOf(index);
    for (const digit of random ? shuffle(choices, random) : choices) {
      const bit = 1 << digit;
      board[index] = digit;
      rows[r] |= bit;
      columns[c] |= bit;
      boxes[b] |= bit;
      search();
      board[index] = 0;
      rows[r] &= ~bit;
      columns[c] &= ~bit;
      boxes[b] &= ~bit;
      if (count >= limit || exhausted) break;
    }
  }
  search();
  return { count, solution, exhausted };
}

export interface PuzzleDefinition {
  level: Level;
  /** Immutable clues, with zero for an editable cell. */
  givens: readonly number[];
  solution: readonly number[];
}

/** Generate a randomized full grid, then remove only clues that preserve uniqueness. */
export function generatePuzzle(level: Level, random: () => number = Math.random): PuzzleDefinition {
  const target = CLUE_TARGETS[level];
  let best: PuzzleDefinition | undefined;
  let bestCount = CELLS + 1;
  // Rarely, a removal order reaches a minimal puzzle above the target. Try a
  // different grid/order, then return the best proven-unique board, never loop forever.
  for (let attempt = 0; attempt < 4; attempt++) {
    const { solution } = solve(Array<number>(CELLS).fill(0), 1, random);
    const givens = [...solution];
    let clues = CELLS;
    for (const i of shuffle(INDICES, random)) {
      const digit = givens[i];
      givens[i] = 0;
      const result = solve(givens, 2);
      if (result.count === 1 && !result.exhausted) clues--;
      else givens[i] = digit;
      if (clues === target) return { level, givens, solution };
    }
    if (clues < bestCount) {
      best = { level, givens, solution };
      bestCount = clues;
    }
  }
  return best!;
}

export interface PuzzleState extends PuzzleDefinition {
  /** Player entries (0 = empty). Given cells are always 0 here. */
  values: number[];
  notes: number[][];
  selected: number | null;
  /** Null means inspection only; choosing a number never edits a cell by itself. */
  activeDigit: number | null;
  pencil: boolean;
  history: { index: number; value: number; notes: number[]; hinted: boolean }[];
  hinted: Record<number, true>;
  hintsLeft: number;
  seconds: number;
}

export const isGiven = (p: PuzzleDefinition, i: number) => validIndex(i) && p.givens[i] !== 0;
export const solutionAt = (p: PuzzleDefinition, i: number) => p.solution[i];

export function freshPuzzle(hints: number, level: Level = 'Medium', random: () => number = Math.random): PuzzleState {
  return {
    ...generatePuzzle(level, random),
    values: Array(CELLS).fill(0),
    notes: Array.from({ length: CELLS }, () => []),
    selected: null,
    activeDigit: null,
    pencil: false,
    history: [],
    hinted: {},
    hintsLeft: hints,
    seconds: 0,
  };
}

export function valueAt(p: PuzzleState, i: number): number {
  return isGiven(p, i) ? p.givens[i] : p.values[i];
}

export function isSolved(p: PuzzleState): boolean {
  return INDICES.every((i) => valueAt(p, i) === solutionAt(p, i));
}

export function isPeer(a: number, b: number): boolean {
  return rowOf(a) === rowOf(b) || columnOf(a) === columnOf(b) || boxOf(a) === boxOf(b);
}

export function selectDigit(p: PuzzleState, digit: number): PuzzleState {
  if (!validDigit(digit)) return p;
  // A new number selection clears the previous cell's row, column, and box highlights.
  return { ...p, selected: null, activeDigit: p.activeDigit === digit ? null : digit };
}

/** A cell tap either paints the active digit or only moves the inspection cursor. */
export function tapCell(p: PuzzleState, index: number): PuzzleState {
  if (!validIndex(index)) return p;
  const selected = { ...p, selected: index };
  return p.activeDigit === null ? selected : enterDigit(selected, p.activeDigit);
}

export function matchesActiveDigit(p: PuzzleState, index: number): boolean {
  return p.activeDigit !== null && valueAt(p, index) === p.activeDigit;
}

/** Write the digit (idempotently), toggle a pencil note, or explicitly erase (0). */
export function enterDigit(p: PuzzleState, digit: number): PuzzleState {
  const i = p.selected;
  if (i === null || !validIndex(i) || isGiven(p, i) || isSolved(p)) return p;
  if (digit !== 0 && !validDigit(digit)) return p;
  // Notes belong only in empty cells; inspecting a filled cell must not erase it.
  if (p.pencil && digit !== 0 && p.values[i] !== 0) return p;
  if (!p.pencil && digit !== 0 && p.values[i] === digit) return p;
  if (digit === 0 && p.values[i] === 0 && p.notes[i].length === 0) return p;

  const values = p.values.slice();
  const notes = p.notes.slice();
  const history = [...p.history, { index: i, value: p.values[i], notes: [...p.notes[i]], hinted: !!p.hinted[i] }];
  const hinted = { ...p.hinted };
  delete hinted[i];
  if (digit === 0) {
    values[i] = 0;
    notes[i] = [];
  } else if (p.pencil) {
    notes[i] = notes[i].includes(digit) ? notes[i].filter((d) => d !== digit) : [...notes[i], digit].sort();
  } else {
    values[i] = digit;
    notes[i] = [];
  }
  return { ...p, values, notes, history, hinted };
}

export function giveHint(p: PuzzleState): PuzzleState {
  if (p.hintsLeft <= 0 || isSolved(p)) return p;
  let i = p.selected;
  if (i === null || !validIndex(i) || isGiven(p, i) || p.values[i] === solutionAt(p, i)) {
    i = INDICES.find((k) => !isGiven(p, k) && p.values[k] !== solutionAt(p, k)) ?? null;
  }
  if (i === null) return p;
  const values = p.values.slice();
  values[i] = solutionAt(p, i);
  const notes = p.notes.slice();
  notes[i] = [];
  return {
    ...p,
    values,
    notes,
    selected: i,
    hinted: { ...p.hinted, [i]: true },
    hintsLeft: p.hintsLeft - 1,
    history: [...p.history, { index: i, value: p.values[i], notes: [...p.notes[i]], hinted: !!p.hinted[i] }],
  };
}

export function undo(p: PuzzleState): PuzzleState {
  const last = p.history[p.history.length - 1];
  if (!last) return p;
  const values = p.values.slice();
  values[last.index] = last.value;
  const notes = p.notes.slice();
  notes[last.index] = last.notes;
  const hinted = { ...p.hinted };
  if (last.hinted) hinted[last.index] = true;
  else delete hinted[last.index];
  return { ...p, values, notes, hinted, history: p.history.slice(0, -1), selected: last.index };
}

export function digitCounts(p: PuzzleState): number[] {
  const counts = Array(10).fill(0);
  for (const i of INDICES) {
    const v = valueAt(p, i);
    if (v) counts[v]++;
  }
  return counts;
}
