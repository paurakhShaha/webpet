import type { GameState } from '@/types';
import { validatePetName } from './naming';

/** Welcome → egg. Starts the warming clock so no time passes "offscreen". */
export function startJourney(state: GameState, now: number): GameState {
  if (state.phase !== 'welcome') return state;
  return { ...state, phase: 'egg', egg: { ...state.egg, lastTickAt: now } };
}

/** Hatch sequence finished → ask for a name. */
export function completeHatch(state: GameState): GameState {
  return state.phase === 'hatching' && state.pet ? { ...state, phase: 'naming' } : state;
}

export type NameOutcome = { ok: true; state: GameState } | { ok: false; error: string };

/** First naming: records both the current and the original name. */
export function namePet(state: GameState, raw: string): NameOutcome {
  if (!state.pet) return { ok: false, error: 'There is no pet to name yet.' };
  const result = validatePetName(raw);
  if (!result.ok) return result;
  return {
    ok: true,
    state: { ...state, phase: 'intro', pet: { ...state.pet, name: result.value, originalName: result.value } },
  };
}

/** Later renames change `name` only; `originalName` is kept forever. */
export function renamePet(state: GameState, raw: string): NameOutcome {
  if (!state.pet) return { ok: false, error: 'There is no pet to rename.' };
  const result = validatePetName(raw);
  if (!result.ok) return result;
  return { ok: true, state: { ...state, pet: { ...state.pet, name: result.value } } };
}

export function finishIntro(state: GameState): GameState {
  return state.phase === 'intro' ? { ...state, phase: 'pet' } : state;
}
