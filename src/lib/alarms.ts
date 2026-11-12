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
  on: boolean;
}

export const LEVELS: Level[] = ['Easy', 'Medium', 'Hard'];
export const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DAY_NAME = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const SAMPLE_ALARMS: Alarm[] = [
  { id: 1, hour: 6, minute: 30, meridiem: 'AM', label: 'Gym', days: [false, true, false, true, false, true, false], level: 'Hard', on: true },
  { id: 2, hour: 7, minute: 15, meridiem: 'AM', label: 'Work', days: [false, true, true, true, true, true, false], level: 'Medium', on: true },
  { id: 3, hour: 9, minute: 0, meridiem: 'AM', label: 'Weekend', days: [true, false, false, false, false, false, true], level: 'Easy', on: false },
  { id: 4, hour: 2, minute: 0, meridiem: 'PM', label: 'Nap', days: [false, false, false, false, false, false, false], level: 'Easy', on: false },
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

/** Minutes from `now` until the alarm next rings, or null if it never will. */
export function minutesUntil(a: Alarm, now: Date): number | null {
  const once = !a.days.some(Boolean);
  for (let k = 0; k <= 7; k++) {
    // Local calendar dates account for 23/25-hour days at DST boundaries.
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k);
    if (!once && !a.days[candidate.getDay()]) continue;
    const minutes = minutesOfDay(a);
    candidate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    const diff = candidate.getTime() - now.getTime();
    if (diff > 0) return Math.ceil(diff / 60000);
  }
  return null;
}

export function nextAlarm(alarms: Alarm[], now: Date): { alarm: Alarm; minutes: number } | null {
  let best: { alarm: Alarm; minutes: number } | null = null;
  for (const a of alarms) {
    if (!a.on) continue;
    const m = minutesUntil(a, now);
    if (m !== null && (!best || m < best.minutes)) best = { alarm: a, minutes: m };
  }
  return best;
}

export function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60);
  return `${h ? `${h} h ` : ''}${minutes % 60} min`;
}

export const formatClock = (seconds: number) => `${Math.floor(seconds / 60)}:${pad2(seconds % 60)}`;
