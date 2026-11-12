import { Alarm, formatTime } from './alarms';

export interface DayResult {
  label: string;
  time: string;
  solved: boolean;
  solveSeconds: number;
}

export interface DayRecord {
  day: number;
  weekday: number;
  future: boolean;
  results: DayResult[];
}

/** Small seeded PRNG so the sample history is stable between renders. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * SAMPLE DATA: builds a month of wake-up results from the repeating alarms.
 * Replace with real records once the alarm engine logs outcomes.
 */
export function sampleMonth(year: number, month: number, today: Date, alarms: Alarm[]): DayRecord[] {
  const rand = mulberry32(year * 100 + month + 7);
  const repeating = alarms.filter((a) => a.on && a.days.some(Boolean));
  const length = new Date(year, month + 1, 0).getDate();
  const out: DayRecord[] = [];
  for (let d = 1; d <= length; d++) {
    const date = new Date(year, month, d);
    const future = date > today;
    const weekday = date.getDay();
    const results = repeating
      .filter((a) => a.days[weekday])
      .map((a) => ({ label: a.label, time: formatTime(a), solved: rand() < 0.8, solveSeconds: 70 + Math.floor(rand() * 260) }));
    out.push({ day: d, weekday, future, results: future ? [] : results });
  }
  return out;
}

export function summarize(records: DayRecord[]) {
  let mornings = 0, won = 0, solveSum = 0, solveCount = 0, streak = 0;
  for (const r of records) {
    if (!r.results.length) continue;
    mornings++;
    if (r.results.every((x) => x.solved)) won++;
    for (const x of r.results) if (x.solved) { solveSum += x.solveSeconds; solveCount++; }
  }
  for (let k = records.length - 1; k >= 0; k--) {
    const r = records[k];
    if (r.future || !r.results.length) continue;
    if (r.results.every((x) => x.solved)) streak++;
    else break;
  }
  return { mornings, won, streak, avgSolve: solveCount ? Math.round(solveSum / solveCount) : null };
}
