import { useCallback, useEffect, useState } from 'react';
import type { GameState } from '@/types';
import { ensureGame, subscribeToGame, updateGame } from '@/storage';

/**
 * Single source of truth is chrome.storage. React state is only a mirror of it,
 * kept in sync across popup and side panel via storage change events.
 */
export function useGame() {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    let alive = true;
    void ensureGame().then((s) => alive && setState(s));
    const off = subscribeToGame((s) => alive && setState(s));
    return () => {
      alive = false;
      off();
    };
  }, []);

  const update = useCallback(async (reducer: (s: GameState) => GameState) => {
    const next = await updateGame(reducer);
    setState(next);
    return next;
  }, []);

  return { state, update };
}

export type UpdateGame = ReturnType<typeof useGame>['update'];
