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

function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const fresh = (hints = 3, seed = 42, level = 'Medium') => S.freshPuzzle(hints, level, seeded(seed));
const editable = (p) => Array.from({ length: 81 }, (_, i) => i).filter((i) => !S.isGiven(p, i));
const select = (p, index = editable(p)[0]) => ({ ...p, selected: index });

function assertValidSolution(solution) {
  const digits = '123456789';
  for (let i = 0; i < 9; i++) {
    const row = solution.slice(i * 9, i * 9 + 9);
    const column = Array.from({ length: 9 }, (_, j) => solution[j * 9 + i]);
    const box = Array.from({ length: 9 }, (_, j) => solution[(Math.floor(i / 3) * 3 + Math.floor(j / 3)) * 9 + (i % 3) * 3 + j % 3]);
    for (const unit of [row, column, box]) assert.equal(unit.sort().join(''), digits);
  }
}

for (const [level, clues] of [['Easy', 44], ['Medium', 35], ['Hard', 28]]) {
  test(`${level} generates varied puzzles with valid, unique solutions and appropriate clues`, () => {
    const boards = new Set(), answers = new Set();
    for (let seed = 1; seed <= 20; seed++) {
      const p = fresh(3, seed, level);
      assert.equal(p.level, level);
      assert.equal(p.givens.length, 81);
      assert.equal(p.solution.length, 81);
      assert.equal(p.givens.filter(Boolean).length, clues);
      assertValidSolution(p.solution);
      assert.deepEqual(solutions(p.givens), [p.solution.join('')]);
      assert.equal(S.isSolved(p), false);
      p.givens.forEach((v, i) => { if (v) assert.equal(v, p.solution[i]); });
      boards.add(p.givens.join(''));
      answers.add(p.solution.join(''));
    }
    assert.equal(boards.size, 20);
    assert.equal(answers.size, 20);
  });
}

test('new puzzles reset all play state without sharing mutable state', () => {
  const a = fresh(3, 1, 'Easy'), b = fresh(1, 2, 'Hard');
  assert.notDeepEqual(a.solution, b.solution);
  assert.equal(b.hintsLeft, 1);
  assert.equal(b.activeDigit, null);
  assert.equal(b.selected, null);
  assert.equal(b.seconds, 0);
  assert.equal(b.pencil, false);
  assert.deepEqual(b.history, []);
  assert.deepEqual(b.hinted, {});
  assert.ok(b.values.every((v) => v === 0));
  b.notes[0].push(3);
  assert.deepEqual(a.notes[0], []);
  assert.deepEqual(b.notes[1], []);
});

test('choosing a digit only selects it; given and entered matches all highlight', () => {
  const p = fresh();
  const [i] = editable(p);
  const digit = p.givens.find(Boolean);
  const withEntry = S.enterDigit(select(p, i), digit);
  const active = S.selectDigit(withEntry, digit);
  assert.equal(active.activeDigit, digit);
  assert.equal(active.selected, null);
  assert.equal(active.values, withEntry.values);
  assert.equal(active.history, withEntry.history);
  assert.equal(active.notes, withEntry.notes);
  for (let j = 0; j < 81; j++) {
    assert.equal(S.matchesActiveDigit(active, j), S.valueAt(active, j) === digit);
  }
  assert.equal(S.matchesActiveDigit(active, i), true);
});

test('number-first entry fills multiple cells, replaces entries, and never toggles a digit off', () => {
  const p = fresh();
  const [i, j] = editable(p);
  const active = S.selectDigit(p, 5);
  const first = S.tapCell(active, i);
  const second = S.tapCell(first, j);
  assert.equal(second.values[i], 5);
  assert.equal(second.values[j], 5);
  assert.equal(second.activeDigit, 5);
  const repeat = S.tapCell(second, j);
  assert.equal(repeat.values[j], 5);
  assert.equal(repeat.history, second.history);
  const switched = S.selectDigit(repeat, 8);
  assert.equal(switched.selected, null);
  assert.equal(switched.values, repeat.values);
  assert.equal(switched.history, repeat.history);
  const replaced = S.tapCell(switched, i);
  assert.equal(replaced.values[i], 8);
  assert.equal(S.undo(replaced).values[i], 5);
  assert.equal(p.values[i], 0);
});

test('deselecting the same number enables inspection without mutating cells or notes', () => {
  let p = fresh();
  const [i, j] = editable(p);
  p = S.tapCell(S.selectDigit(p, 4), i);
  const inspect = S.selectDigit(p, 4);
  assert.equal(inspect.activeDigit, null);
  assert.equal(inspect.selected, null);
  for (const index of [i, j, p.givens.findIndex(Boolean)]) {
    const tapped = S.tapCell(inspect, index);
    assert.equal(tapped.selected, index);
    assert.equal(tapped.values, inspect.values);
    assert.equal(tapped.notes, inspect.notes);
    assert.equal(tapped.history, inspect.history);
    assert.equal(tapped.hinted, inspect.hinted);
    for (let cell = 0; cell < 81; cell++) assert.equal(S.matchesActiveDigit(tapped, cell), false);
  }
  const chosenAgain = S.selectDigit(S.tapCell(inspect, j), 7);
  assert.equal(chosenAgain.values[j], 0, 'choosing a number must not fill the previously inspected cell');
});

test('givens and invalid input cannot be edited', () => {
  const p = fresh();
  const givenIndex = p.givens.findIndex(Boolean);
  const given = select(p, givenIndex);
  assert.equal(S.enterDigit(given, 9), given);
  const tapped = S.tapCell(S.selectDigit(p, 9), givenIndex);
  assert.equal(tapped.values, p.values);
  assert.equal(S.valueAt(tapped, givenIndex), p.givens[givenIndex]);
  const selected = select(p);
  for (const d of [-1, 10, NaN, 1.5]) {
    assert.equal(S.enterDigit(selected, d), selected);
    assert.equal(S.selectDigit(p, d), p);
  }
  for (const i of [-1, 81, NaN, 0.5]) assert.equal(S.tapCell(p, i), p);
});

test('notes use the active digit on empty cells and do not destroy filled cells', () => {
  const p = fresh();
  const [i, j] = editable(p);
  const active = S.selectDigit({ ...p, pencil: true }, 7);
  const noted = S.tapCell(active, i);
  assert.deepEqual(noted.notes[i], [7]);
  assert.equal(noted.values[i], 0);
  assert.deepEqual(S.tapCell(noted, i).notes[i], []);
  assert.deepEqual(S.undo(noted).notes[i], []);
  const inspected = S.tapCell(S.selectDigit(noted, 7), i);
  assert.deepEqual(inspected.notes[i], [7]);
  const filled = S.tapCell({ ...noted, pencil: false }, j);
  const pencil = S.selectDigit({ ...filled, pencil: true }, 2);
  assert.equal(S.tapCell(pencil, j).values[j], 7);
  const erased = S.enterDigit(select(filled, i), 0);
  assert.deepEqual(erased.notes[i], []);
  assert.deepEqual(S.undo(erased).notes[i], [7]);
});

test('hints use each generated solution and undo restores notes and markers without a refund', () => {
  for (const level of ['Easy', 'Medium', 'Hard']) {
    const p = S.enterDigit({ ...select(fresh(1, 19, level)), pencil: true }, 2);
    const i = p.selected;
    const hinted = S.giveHint(p);
    assert.equal(hinted.values[i], S.solutionAt(p, i));
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
  }
});

test('each generated game can be completed through number-first entry', () => {
  for (const level of ['Easy', 'Medium', 'Hard']) {
    let p = fresh(3, 94, level);
    for (const i of editable(p)) {
      const digit = S.solutionAt(p, i);
      if (p.activeDigit !== digit) p = S.selectDigit(p, digit);
      p = S.tapCell(p, i);
    }
    assert.equal(S.isSolved(p), true);
    assert.deepEqual(S.digitCounts(p).slice(1), Array(9).fill(9));
    assert.equal(S.enterDigit(p, 0), p);
    assert.equal(S.giveHint(p), p);
    assert.equal(S.isSolved(S.undo(p)), false);
  }
});
