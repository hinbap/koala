import React, { createContext, useContext, useMemo } from 'react';
import { Mode, resolveTheme, Theme, ThemeId, THEME_ORDER } from './themes';
import { usePersistentState } from '../hooks/usePersistentState';

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  mode: Mode;
  setThemeId: (id: ThemeId) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  storageError: string | null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { value: appearance, setValue: setAppearance, ready, error } = usePersistentState<{ themeId: ThemeId; mode: Mode }>(
    'koala.appearance.v1', { themeId: 'veriel' as ThemeId, mode: 'dark' as Mode },
    data => {
      const saved = data as { themeId?: ThemeId; mode?: Mode } | null;
      return { themeId: saved?.themeId && THEME_ORDER.includes(saved.themeId) ? saved.themeId : 'veriel', mode: saved?.mode === 'light' ? 'light' : 'dark' };
    },
  );
  const { themeId, mode } = appearance;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolveTheme(themeId, mode),
      themeId,
      mode,
      setThemeId: themeId => setAppearance(a => ({ ...a, themeId })),
      setMode: mode => setAppearance(a => ({ ...a, mode })),
      toggleMode: () => setAppearance(a => ({ ...a, mode: a.mode === 'dark' ? 'light' : 'dark' })),
      storageError: error,
    }),
    [themeId, mode, setAppearance, error],
  );

  return <ThemeContext.Provider value={value}>{ready ? children : null}</ThemeContext.Provider>;
}

export function useThemeControls(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls must be used inside <ThemeProvider>');
  return ctx;
}

export function useTheme(): Theme {
  return useThemeControls().theme;
}
