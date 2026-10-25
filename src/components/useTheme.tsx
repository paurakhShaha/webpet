import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { ThemePreference } from '@/types';
import { loadSettings, subscribeToSettings, updateSettings } from '@/storage';

const query = () => window.matchMedia('(prefers-color-scheme: dark)');
const subscribeSystem = (cb: () => void) => {
  const mq = query();
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

export interface ThemeApi {
  /** The theme actually showing. */
  effective: 'light' | 'dark';
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeApi>({ effective: 'light', toggle: () => {} });
export const useThemeApi = () => useContext(ThemeContext);

/** Applies the saved preference to <html data-theme>. 'system' follows the OS. */
export function useThemeState(): ThemeApi {
  const [pref, setPref] = useState<ThemePreference>('system');
  const systemDark = useSyncExternalStore(subscribeSystem, () => query().matches);

  useEffect(() => {
    void loadSettings().then((s) => setPref(s.theme));
    return subscribeToSettings((s) => setPref(s.theme));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (pref === 'system') delete root.dataset.theme;
    else root.dataset.theme = pref;
  }, [pref]);

  const effective = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;
  const toggle = useCallback(() => {
    const next = effective === 'dark' ? 'light' : 'dark';
    setPref(next);
    void updateSettings({ theme: next });
  }, [effective]);

  return { effective, toggle };
}
