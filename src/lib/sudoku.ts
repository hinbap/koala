/** One fixed puzzle with a unique solution (36 givens). */
export const SOLUTION = '745926138831475692296381547467192853358647219912538764573264981189753426624819375';
export const GIVEN_MASK = '011011011000010110000000011101101001111000100011001110101000001010011010011110000';

export const CELLS = 81;

export interface PuzzleState {
  /** Player entries (0 = empty). Given cells are always 0 here. */
  values: number[];
  notes: number[][];
  selected: number | null;
  pencil: boolean;
  history: { index: number; value: number; notes: number[]; hinted: boolean }[];
  hinted: Record<number, true>;
  hintsLeft: number;
  seconds: number;
}

export const isGiven = (i: number) => GIVEN_MASK[i] === '1';
export const solutionAt = (i: number) => Number(SOLUTION[i]);

export function freshPuzzle(hints: number): PuzzleState {
  return {
    values: Array(CELLS).fill(0),
    notes: Array.from({ length: CELLS }, () => []),
    selected: null,
    pencil: false,
    history: [],
    hinted: {},
    hintsLeft: hints,
    seconds: 0,
  };
}

export function valueAt(p: PuzzleState, i: number): number {
  return isGiven(i) ? solutionAt(i) : p.values[i];
}

export function isSolved(p: PuzzleState): boolean {
  for (let i = 0; i < CELLS; i++) if (valueAt(p, i) !== solutionAt(i)) return false;
  return true;
}

export function isPeer(a: number, b: number): boolean {
  const ra = Math.floor(a / 9), ca = a % 9, rb = Math.floor(b / 9), cb = b % 9;
  return ra === rb || ca === cb || (Math.floor(ra / 3) === Math.floor(rb / 3) && Math.floor(ca / 3) === Math.floor(cb / 3));
}

/** Enter a digit (1–9) or erase (0) in the selected cell. */
export function enterDigit(p: PuzzleState, digit: number): PuzzleState {
  const i = p.selected;
  if (i === null || !Number.isInteger(i) || i < 0 || i >= CELLS || isGiven(i) || isSolved(p)) return p;
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) return p;
  const values = p.values.slice();
  const notes = p.notes.map((n) => n.slice());
  const history = [...p.history, { index: i, value: p.values[i], notes: p.notes[i].slice(), hinted: !!p.hinted[i] }];
  const hinted = { ...p.hinted };
  delete hinted[i];
  if (digit === 0) {
    values[i] = 0;
    notes[i] = [];
  } else if (p.pencil) {
    values[i] = 0;
    notes[i] = notes[i].includes(digit) ? notes[i].filter((d) => d !== digit) : [...notes[i], digit].sort();
  } else {
    values[i] = values[i] === digit ? 0 : digit;
    notes[i] = [];
  }
  return { ...p, values, notes, history, hinted };
}

export function giveHint(p: PuzzleState): PuzzleState {
  if (p.hintsLeft <= 0 || isSolved(p)) return p;
  let i = p.selected;
  if (i === null || isGiven(i) || p.values[i] === solutionAt(i)) {
    i = null;
    for (let k = 0; k < CELLS; k++) {
      if (!isGiven(k) && p.values[k] !== solutionAt(k)) {
        i = k;
        break;
      }
    }
  }
  if (i === null) return p;
  const values = p.values.slice();
  values[i] = solutionAt(i);
  const notes = p.notes.slice();
  notes[i] = [];
  return {
    ...p,
    values,
    notes,
    selected: i,
    hinted: { ...p.hinted, [i]: true },
    hintsLeft: p.hintsLeft - 1,
    history: [...p.history, { index: i, value: p.values[i], notes: p.notes[i].slice(), hinted: !!p.hinted[i] }],
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
  for (let i = 0; i < CELLS; i++) {
    const v = valueAt(p, i);
    if (v) counts[v]++;
  }
  return counts;
}
