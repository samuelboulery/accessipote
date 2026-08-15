import { useState, useEffect, useCallback } from 'react';

/** `system` ne stocke rien : l'absence de choix EST le suivi du navigateur. */
export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** L'ordre du cycle du bouton. */
export const THEME_CYCLE: ThemeMode[] = ['light', 'dark', 'system'];

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : 'system';
}

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches;
}

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

export function useDarkMode() {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [systemIsDark, setSystemIsDark] = useState(prefersDark);

  // En mode système, un changement de préférence du navigateur doit se voir
  // tout de suite, sans rechargement.
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const handler = (event: MediaQueryListEvent) => setSystemIsDark(event.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  const isDark = mode === 'system' ? systemIsDark : mode === 'dark';

  useEffect(() => {
    applyDarkClass(isDark);
  }, [isDark]);

  const setThemeMode = useCallback((next: ThemeMode) => {
    if (next === 'system') window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, next);
    setMode(next);
  }, []);

  const cycle = useCallback(() => {
    setThemeMode(THEME_CYCLE[(THEME_CYCLE.indexOf(mode) + 1) % THEME_CYCLE.length]);
  }, [mode, setThemeMode]);

  return { mode, isDark, setThemeMode, cycle };
}
