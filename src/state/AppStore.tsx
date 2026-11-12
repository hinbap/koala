import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { AppState } from 'react-native';
import { Alarm, Level, nextAlarm, SAMPLE_ALARMS, formatTime, msUntil } from '../lib/alarms';
import { AlarmSoundId } from '../lib/sounds';
import { DEFAULT_SETTINGS, restoreSettings, Settings, updateAllowedSettings } from '../lib/settings';
import { usePersistentState } from '../hooks/usePersistentState';
import * as Sudoku from '../lib/sudoku';
export type { Settings } from '../lib/settings';

export interface Ringing {
  id: string;
  alarmId?: number;
  label: string;
  time: string;
  sound: AlarmSoundId;
}
interface Session {
  ringing: Ringing | null;
  practicing: boolean;
  puzzle: Sudoku.PuzzleState;
  startedAt: number;
  lastMoveAt: number | null;
}
interface SavedState {
  settings: Settings;
  alarms: Alarm[];
  session: Session | null;
  handled: string[];
}
interface AppStore {
  ready: boolean;
  storageError: string | null;
  alarms: Alarm[];
  saveAlarm: (alarm: Omit<Alarm, 'id'> & { id: number | null }) => void;
  deleteAlarm: (id: number) => void;
  toggleAlarm: (id: number) => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  ringing: Ringing | null;
  alarmActive: boolean;
  alarmsLocked: boolean;
  startRinging: (alarm?: Alarm, occurrenceAt?: number) => void;
  practicing: boolean;
  startPractice: (level: Level) => void;
  endSession: () => void;
  puzzle: Sudoku.PuzzleState;
  lastMoveAt: number | null;
  updatePuzzle: (fn: (p: Sudoku.PuzzleState) => Sudoku.PuzzleState) => void;
  newGame: (level?: Level) => void;
}
const StoreContext = createContext<AppStore | null>(null);

function armOnce(a: Alarm): Alarm {
  if (a.days.some(Boolean) || !a.on) return { ...a, oneTimeAt: undefined };
  return { ...a, oneTimeAt: a.oneTimeAt ?? Date.now() + (msUntil(a, new Date()) ?? 0) };
}
function validAlarm(value: unknown): value is Alarm {
  if (!value || typeof value !== 'object') return false;
  const a = value as Alarm;
  return Number.isInteger(a.id) && Number.isInteger(a.hour) && a.hour >= 1 && a.hour <= 12 &&
    Number.isInteger(a.minute) && a.minute >= 0 && a.minute < 60 && ['AM', 'PM'].includes(a.meridiem) &&
    typeof a.label === 'string' && Array.isArray(a.days) && a.days.length === 7 && a.days.every(d => typeof d === 'boolean') &&
    ['Easy', 'Medium', 'Hard'].includes(a.level) && a.sound === 'nuclear' && typeof a.on === 'boolean' &&
    (a.oneTimeAt === undefined || Number.isFinite(a.oneTimeAt));
}
function validSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const s = value as Session;
  const p = s.puzzle;
  const grid = (v: unknown) => Array.isArray(v) && v.length === 81 && v.every(n => Number.isInteger(n) && n >= 0 && n <= 9);
  return Number.isFinite(s.startedAt) && typeof s.practicing === 'boolean' &&
    (s.lastMoveAt === null || Number.isFinite(s.lastMoveAt)) &&
    (s.ringing === null || (typeof s.ringing?.id === 'string' && typeof s.ringing.label === 'string' && typeof s.ringing.time === 'string' && s.ringing.sound === 'nuclear')) &&
    !!p && grid(p.givens) && grid(p.solution) && grid(p.values) &&
    Array.isArray(p.notes) && p.notes.length === 81 && p.notes.every(n => Array.isArray(n)) &&
    Array.isArray(p.history) && !!p.hinted && typeof p.hinted === 'object' &&
    Number.isInteger(p.hintsLeft) && Number.isFinite(p.seconds) && ['Easy', 'Medium', 'Hard'].includes(p.level);
}
function restore(data: unknown): SavedState {
  const s = (data && typeof data === 'object' ? data : {}) as Partial<SavedState>;
  return {
    settings: restoreSettings(s.settings),
    alarms: (Array.isArray(s.alarms) ? s.alarms.filter(validAlarm) : SAMPLE_ALARMS).map(armOnce),
    session: validSession(s.session) ? s.session : null,
    handled: Array.isArray(s.handled) ? s.handled.filter(id => typeof id === 'string').slice(-100) : [],
  };
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState<SavedState>(() => restore({ settings: DEFAULT_SETTINGS, alarms: SAMPLE_ALARMS }));
  const { value: state, setValue: setState, ready, error } = usePersistentState('koala.state.v1', initial, restore);
  const [emptyPuzzle] = useState(() => Sudoku.freshPuzzle(DEFAULT_SETTINGS.hintsPerPuzzle));
  const [now, setNow] = useState(Date.now);
  const { settings, alarms, session } = state;
  const ringing = session?.ringing ?? null;
  const alarmActive = !!ringing && !!session && !Sudoku.isSolved(session.puzzle);
  const alarmsLocked = alarmActive && settings.lockWhileRinging;
  const sessionActive = session !== null;
  const puzzle = useMemo(() => {
    if (!session) return emptyPuzzle;
    return Sudoku.isSolved(session.puzzle) ? session.puzzle : {
      ...session.puzzle, seconds: Math.max(0, Math.floor((now - session.startedAt) / 1000)),
    };
  }, [session, now, emptyPuzzle]);

  useEffect(() => {
    if (!sessionActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener('change', status => { if (status === 'active') setNow(Date.now()); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [sessionActive]);

  const startRinging = useCallback((alarm?: Alarm, occurrenceAt?: number) => {
    const timestamp = Date.now();
    setNow(timestamp);
    setState(current => {
      if (current.session?.ringing && !Sudoku.isSolved(current.session.puzzle)) return current;
      const a = alarm ?? nextAlarm(current.alarms, new Date())?.alarm ?? current.alarms[0];
      const id = alarm ? `${alarm.id}:${Math.floor((occurrenceAt ?? timestamp) / 60000)}` : `test:${timestamp}`;
      if (current.handled.includes(id)) return current;
      // Ignore notifications belonging to an alarm that was disabled or deleted.
      if (alarm && !current.alarms.some(item => item.id === alarm.id && item.on)) return current;
      return {
        ...current,
        handled: [...current.handled, id].slice(-100),
        alarms: alarm && !alarm.days.some(Boolean) ? current.alarms.map(item => item.id === alarm.id ? { ...item, on: false } : item) : current.alarms,
        session: {
          ringing: { id, alarmId: alarm?.id, label: a?.label ?? 'Alarm', time: a ? `${formatTime(a)} ${a.meridiem}` : '', sound: a?.sound ?? current.settings.defaultSound },
          practicing: false, startedAt: timestamp, lastMoveAt: null,
          puzzle: Sudoku.freshPuzzle(current.settings.hintsPerPuzzle, a?.level ?? current.settings.defaultLevel),
        },
      };
    });
    router.navigate('/puzzle');
  }, [setState]);

  // Foreground alarm delivery also works on web, where local notifications are unavailable.
  useEffect(() => {
    if (!ready) return;
    const baseline = new Date();
    const due = alarms.filter(a => a.on).map(alarm => ({ alarm, at: alarm.oneTimeAt ?? baseline.getTime() + (msUntil(alarm, baseline) ?? Infinity) }));
    const tick = () => {
      if (AppState.currentState !== 'active' && AppState.currentState !== null) return;
      const next = due.find(item => item.at <= Date.now());
      if (next) {
        startRinging(next.alarm, next.at);
        if (next.alarm.days.some(Boolean)) {
          const current = new Date();
          next.at = current.getTime() + (msUntil(next.alarm, current) ?? Infinity);
        } else due.splice(due.indexOf(next), 1);
      }
    };
    const timer = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', status => { if (status === 'active') tick(); });
    tick();
    return () => { clearInterval(timer); sub.remove(); };
  }, [alarms, ready, startRinging]);

  const value: AppStore = {
    ready, storageError: error, alarms, settings, ringing, alarmActive, alarmsLocked,
    practicing: session?.practicing ?? false, puzzle, lastMoveAt: session?.lastMoveAt ?? null,
    startRinging,
    saveAlarm: draft => {
      if (alarmsLocked) return;
      setState(current => {
        const id = draft.id ?? Math.max(0, ...current.alarms.map(a => a.id)) + 1;
        const alarm = armOnce({ ...draft, id, label: draft.label.trim() || 'Alarm', oneTimeAt: undefined });
        return { ...current, alarms: draft.id === null ? [...current.alarms, alarm] : current.alarms.map(a => a.id === id ? alarm : a) };
      });
    },
    deleteAlarm: id => { if (!alarmsLocked) setState(s => ({ ...s, alarms: s.alarms.filter(a => a.id !== id) })); },
    toggleAlarm: id => { if (!alarmsLocked) setState(s => ({ ...s, alarms: s.alarms.map(a => a.id === id ? armOnce({ ...a, on: !a.on, oneTimeAt: undefined }) : a) })); },
    updateSettings: patch => setState(s => ({ ...s, settings: updateAllowedSettings(s.settings, patch, alarmActive) })),
    startPractice: level => {
      if (alarmActive) { router.navigate('/puzzle'); return; }
      const timestamp = Date.now();
      setNow(timestamp);
      setState(s => ({ ...s, session: { ringing: null, practicing: true, startedAt: timestamp, lastMoveAt: null, puzzle: Sudoku.freshPuzzle(s.settings.hintsPerPuzzle, level) } }));
      router.navigate('/puzzle');
    },
    endSession: () => {
      if (alarmActive) return;
      setState(s => ({ ...s, session: null }));
      router.dismissTo('/');
    },
    updatePuzzle: fn => setState(s => {
      if (!s.session || Sudoku.isSolved(s.session.puzzle)) return s;
      const before = s.session.puzzle;
      const after = fn(before);
      // Selecting a digit or inspecting a cell is not a solving move.
      const moved = before.values !== after.values || before.notes !== after.notes;
      return { ...s, session: { ...s.session,
        puzzle: { ...after, seconds: Math.max(0, Math.floor((Date.now() - s.session.startedAt) / 1000)) },
        lastMoveAt: moved ? Date.now() : s.session.lastMoveAt,
      } };
    }),
    newGame: (level = puzzle.level) => {
      if (alarmActive) return;
      const timestamp = Date.now();
      setNow(timestamp);
      setState(s => ({ ...s, session: { ringing: null, practicing: true, startedAt: timestamp, lastMoveAt: null, puzzle: Sudoku.freshPuzzle(s.settings.hintsPerPuzzle, level) } }));
    },
  };
  return <StoreContext.Provider value={value}>{ready ? children : null}</StoreContext.Provider>;
}

export function useStore(): AppStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AppStoreProvider>');
  return ctx;
}
