import React, { createContext, useContext, useMemo, useState } from 'react';
import { Mode, resolveTheme, Theme, ThemeId } from './themes';

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  mode: Mode;
  setThemeId: (id: ThemeId) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('dusk');
  const [mode, setMode] = useState<Mode>('dark');

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolveTheme(themeId, mode),
      themeId,
      mode,
      setThemeId,
      setMode,
      toggleMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    }),
    [themeId, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeControls(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls must be used inside <ThemeProvider>');
  return ctx;
}

export function useTheme(): Theme {
  return useThemeControls().theme;
}
