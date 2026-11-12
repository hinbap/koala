import type { AlarmSoundId } from './sounds';

export type Level = 'Easy' | 'Medium' | 'Hard';
export type Meridiem = 'AM' | 'PM';

export interface Alarm {
  id: number;
  hour: number; // 1–12
  minute: number; // 0–59
  meridiem: Meridiem;
  label: string;
  /** Index 0 = Sunday … 6 = Saturday. All false = rings once. */
  days: boolean[];
  level: Level;
  sound: AlarmSoundId;
  on: boolean;
  /** Absolute firing time for an enabled one-time alarm, preserved across restarts. */
  oneTimeAt?: number;
}

export const LEVELS: Level[] = ['Easy', 'Medium', 'Hard'];
export const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DAY_NAME = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const SAMPLE_ALARMS: Alarm[] = [
  { id: 1, hour: 6, minute: 30, meridiem: 'AM', label: 'Gym', days: [false, true, false, true, false, true, false], level: 'Hard', sound: 'nuclear', on: true },
  { id: 2, hour: 7, minute: 15, meridiem: 'AM', label: 'Work', days: [false, true, true, true, true, true, false], level: 'Medium', sound: 'nuclear', on: true },
  { id: 3, hour: 9, minute: 0, meridiem: 'AM', label: 'Weekend', days: [true, false, false, false, false, false, true], level: 'Easy', sound: 'nuclear', on: false },
  { id: 4, hour: 2, minute: 0, meridiem: 'PM', label: 'Nap', days: [false, false, false, false, false, false, false], level: 'Easy', sound: 'nuclear', on: false },
];

export const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

export const formatTime = (a: Pick<Alarm, 'hour' | 'minute'>) => `${a.hour}:${pad2(a.minute)}`;

export function minutesOfDay(a: Pick<Alarm, 'hour' | 'minute' | 'meridiem'>): number {
  return ((a.hour % 12) + (a.meridiem === 'PM' ? 12 : 0)) * 60 + a.minute;
}

export function describeDays(days: boolean[]): string {
  const n = days.filter(Boolean).length;
  if (n === 0) return 'Once';
  if (n === 7) return 'Every day';
  if (n === 5 && days[1] && days[2] && days[3] && days[4] && days[5]) return 'Weekdays';
  if (n === 2 && days[0] && days[6]) return 'Weekends';
  const out: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const k = i % 7;
    if (days[k]) out.push(DAY_NAME[k]);
  }
  return out.join(', ');
}

/** Milliseconds from `now` until the alarm next rings, or null if it never will. */
export function msUntil(a: Alarm, now: Date): number | null {
  const once = !a.days.some(Boolean);
  if (once && a.oneTimeAt !== undefined) return Math.max(0, a.oneTimeAt - now.getTime());
  for (let k = 0; k <= 7; k++) {
    // Local calendar dates account for 23/25-hour days at DST boundaries.
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k);
    if (!once && !a.days[candidate.getDay()]) continue;
    const minutes = minutesOfDay(a);
    candidate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    const diff = candidate.getTime() - now.getTime();
    if (diff > 0) return diff;
  }
  return null;
}

/** Whole minutes left, rounded down: 38 min 45 s shows as 38. */
export function minutesUntil(a: Alarm, now: Date): number | null {
  const ms = msUntil(a, now);
  return ms === null ? null : Math.floor(ms / 60000);
}

export function nextAlarm(alarms: Alarm[], now: Date): { alarm: Alarm; minutes: number } | null {
  // Compare exact milliseconds, not the rounded minutes shown on screen.
  let best: { alarm: Alarm; ms: number } | null = null;
  for (const a of alarms) {
    if (!a.on) continue;
    const ms = msUntil(a, now);
    if (ms !== null && (!best || ms < best.ms)) best = { alarm: a, ms };
  }
  return best && { alarm: best.alarm, minutes: Math.floor(best.ms / 60000) };
}

export function formatCountdown(minutes: number): string {
  if (minutes < 1) return 'under 1 min';
  const h = Math.floor(minutes / 60);
  return `${h ? `${h} h ` : ''}${minutes % 60} min`;
}

export const formatClock = (seconds: number) => `${Math.floor(seconds / 60)}:${pad2(seconds % 60)}`;
