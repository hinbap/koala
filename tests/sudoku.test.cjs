const assert = require('node:assert/strict');
const { test } = require('node:test');
const S = require('../src/lib/sudoku.ts');

// Independent constraint solver: verifies the puzzle has exactly one solution.
function solutions(givens) {
  const grid = givens.slice();
  const found = [];
  const candidates = (i) => {
    const r = Math.floor(i / 9), c = i % 9;
    const used = new Set();
    for (let j = 0; j < 9; j++) {
      used.add(grid[r * 9 + j]);
      used.add(grid[j * 9 + c]);
      used.add(grid[(Math.floor(r / 3) * 3 + Math.floor(j / 3)) * 9 + Math.floor(c / 3) * 3 + j % 3]);
    }
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !used.has(d));
  };
  function search() {
    if (found.length === 2) return;
    let index = -1, digits = [];
    for (let i = 0; i < 81; i++) {
      if (grid[i]) continue;
      const options = candidates(i);
      if (!options.length) return;
      if (index < 0 || options.length < digits.length) { index = i; digits = options; }
    }
    if (index < 0) { found.push(grid.join('')); return; }
    for (const digit of digits) { grid[index] = digit; search(); }
    grid[index] = 0;
  }
  search();
  return found;
}

const editable = Array.from({ length: 81 }, (_, i) => i).filter((i) => !S.isGiven(i));
const select = (p, index = editable[0]) => ({ ...p, selected: index });

test('the supplied clues have exactly the accepted solution', () => {
  assert.equal(S.SOLUTION.length, 81);
  assert.equal(S.GIVEN_MASK.length, 81);
  assert.deepEqual(solutions(Array.from({ length: 81 }, (_, i) => S.isGiven(i) ? S.solutionAt(i) : 0)), [S.SOLUTION]);
});

test('entries, notes, erase and undo preserve previous state', () => {
  const initial = select(S.freshPuzzle(3));
  const i = initial.selected;
  const entry = S.enterDigit(initial, 5);
  assert.equal(initial.values[i], 0);
  assert.equal(entry.values[i], 5);
  const erased = S.enterDigit(entry, 0);
  assert.equal(erased.values[i], 0);
  assert.equal(S.undo(erased).values[i], 5);
  const noted = S.enterDigit({ ...initial, pencil: true }, 7);
  assert.deepEqual(noted.notes[i], [7]);
  assert.equal(noted.values[i], 0);
  assert.deepEqual(S.enterDigit(noted, 7).notes[i], []);
  assert.deepEqual(S.undo(noted).notes[i], []);
});

test('givens, invalid digits and invalid selections cannot be edited', () => {
  const given = select(S.freshPuzzle(3), S.GIVEN_MASK.indexOf('1'));
  assert.equal(S.enterDigit(given, 9), given);
  const p = select(S.freshPuzzle(3));
  for (const d of [-1, 10, NaN, 1.5]) assert.equal(S.enterDigit(p, d), p);
  const invalid = select(p, 81);
  assert.equal(S.enterDigit(invalid, 3), invalid);
});

test('hint undo restores notes and markers without refunding a used hint', () => {
  const p = S.enterDigit({ ...select(S.freshPuzzle(1)), pencil: true }, 2);
  const i = p.selected;
  const hinted = S.giveHint(p);
  assert.equal(hinted.values[i], S.solutionAt(i));
  assert.equal(hinted.hinted[i], true);
  assert.equal(hinted.hintsLeft, 0);
  assert.equal(S.giveHint(hinted), hinted);
  const undone = S.undo(hinted);
  assert.deepEqual(undone.notes[i], [2]);
  assert.equal(undone.values[i], 0);
  assert.equal(undone.hinted[i], undefined);
  assert.equal(undone.hintsLeft, 0);
  const erased = S.enterDigit(hinted, 0);
  assert.equal(erased.hinted[i], undefined);
  assert.equal(S.undo(erased).hinted[i], true);
});

test('only a complete correct puzzle is solved and its digits total nine each', () => {
  let p = S.freshPuzzle(3);
  for (const i of editable) p = S.enterDigit(select(p, i), S.solutionAt(i));
  assert.equal(S.isSolved(p), true);
  assert.deepEqual(S.digitCounts(p).slice(1), Array(9).fill(9));
  assert.equal(S.enterDigit(p, 0), p);
  assert.equal(S.giveHint(p), p);
  assert.equal(S.isSolved(S.undo(p)), false);
});
