import type { AdventureState, GameState } from '@/types';

export const emptyAdventureState = (): AdventureState => ({
  active: null,
  pending: null,
  history: [],
  completed: 0,
  notifiedId: null,
});

/** True while the pet is out exploring (departed and not yet due back). */
export const isPetAway = (state: GameState, now: number): boolean =>
  !!state.adventure?.active && now < state.adventure.active.expectedCompletion;
