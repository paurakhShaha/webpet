import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '@/types';
import { DEFAULT_SETTINGS, loadSettings, subscribeToSettings, updateSettings } from '@/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    void loadSettings().then(setSettings);
    return subscribeToSettings(setSettings);
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    await updateSettings(patch);
  }, []);

  return { settings, update };
}
