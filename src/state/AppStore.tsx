import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { AppState } from 'react-native';
import { Alarm, Level, nextAlarm, SAMPLE_ALARMS, formatTime } from '../lib/alarms';
import * as Sudoku from '../lib/sudoku';

export interface Settings {
  defaultLevel: Level;
  hintsPerPuzzle: number;
  showMistakes: boolean;
  volumeClimbsBack: boolean;
  overridePhoneVolume: boolean;
  vibrate: boolean;
  backupAlarm: boolean;
  lockWhileRinging: boolean;
}

export interface Ringing {
  label: string;
  time: string;
}

interface AppStore {
  // alarms
  alarms: Alarm[];
  saveAlarm: (alarm: Omit<Alarm, 'id'> & { id: number | null }) => void;
  deleteAlarm: (id: number) => void;
  toggleAlarm: (id: number) => void;

  // settings
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  // ringing + puzzle
  ringing: Ringing | null;
  startRinging: () => void;
  finishRinging: () => void;
  puzzle: Sudoku.PuzzleState;
  updatePuzzle: (fn: (p: Sudoku.PuzzleState) => Sudoku.PuzzleState) => void;
  newGame: () => void;
}

const StoreContext = createContext<AppStore | null>(null);

const DEFAULT_SETTINGS: Settings = {
  defaultLevel: 'Medium',
  hintsPerPuzzle: 3,
  showMistakes: true,
  volumeClimbsBack: true,
  overridePhoneVolume: true,
  vibrate: true,
  backupAlarm: true,
  lockWhileRinging: true,
};

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>(SAMPLE_ALARMS);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ringing, setRinging] = useState<Ringing | null>(null);
  const [puzzle, setPuzzle] = useState<Sudoku.PuzzleState>(() => Sudoku.freshPuzzle(DEFAULT_SETTINGS.hintsPerPuzzle));
  const nextId = useRef(SAMPLE_ALARMS.length + 1);
  const startedAt = useRef(0);

  // The solve timer keeps running while the alarm rings, whichever screen is open.
  useEffect(() => {
    if (!ringing) return;
    const tick = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - startedAt.current) / 1000));
      setPuzzle((p) => (Sudoku.isSolved(p) || p.seconds === seconds ? p : { ...p, seconds }));
    };
    const id = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [ringing]);

  const value = useMemo<AppStore>(
    () => ({
      alarms,
      saveAlarm: (draft) => {
        const label = draft.label.trim() || 'Alarm';
        if (draft.id === null) {
          const id = nextId.current++;
          setAlarms((list) => [...list, { ...draft, label, id, on: true }]);
        } else {
          const id = draft.id;
          setAlarms((list) => list.map((a) => (a.id === id ? { ...draft, label, id } : a)));
        }
      },
      deleteAlarm: (id) => setAlarms((list) => list.filter((a) => a.id !== id)),
      toggleAlarm: (id) => setAlarms((list) => list.map((a) => (a.id === id ? { ...a, on: !a.on } : a))),

      settings,
      updateSettings: (patch) => setSettings((s) => ({ ...s, ...patch })),

      ringing,
      startRinging: () => {
        if (ringing) {
          router.navigate('/puzzle');
          return;
        }
        const next = nextAlarm(alarms, new Date());
        const a = next?.alarm ?? alarms[0];
        startedAt.current = Date.now();
        setRinging({ label: a?.label ?? 'Alarm', time: a ? `${formatTime(a)} ${a.meridiem}` : '' });
        setPuzzle(Sudoku.freshPuzzle(settings.hintsPerPuzzle));
        router.navigate('/puzzle');
      },
      finishRinging: () => {
        setRinging(null);
        router.dismissTo('/');
      },
      puzzle,
      updatePuzzle: (fn) => setPuzzle(fn),
      newGame: () => {
        startedAt.current = Date.now();
        setPuzzle(Sudoku.freshPuzzle(settings.hintsPerPuzzle));
      },
    }),
    [alarms, settings, ringing, puzzle],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): AppStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AppStoreProvider>');
  return ctx;
}
