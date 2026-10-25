import type { EggAction, GameState } from '@/types';
import { generatePet } from '@/pet/generatePet';
import { GAME_CONFIG } from './config';
import { ACTION_MESSAGES, MILESTONE_MESSAGES } from './messages';

export interface ActionStatus {
  ready: boolean;
  remainingMs: number;
}

export function getActionStatus(state: GameState, action: EggAction, now: number): ActionStatus {
  const last = state.egg.lastActionAt[action];
  const remainingMs = last === undefined ? 0 : Math.max(0, last + GAME_CONFIG.eggActions[action].cooldownMs - now);
  return { ready: remainingMs === 0, remainingMs };
}

/** Adds progress; if the egg reaches 100 it starts hatching and the pet is born (deterministically). */
function addProgress(state: GameState, amount: number, now: number): GameState {
  const { egg } = state;
  const hatchProgress = Math.min(egg.hatchRequired, egg.hatchProgress + amount);
  const nextEgg = { ...egg, hatchProgress };
  if (hatchProgress < egg.hatchRequired) return { ...state, egg: nextEgg };
  return { ...state, egg: nextEgg, phase: 'hatching', pet: state.pet ?? generatePet(nextEgg, now) };
}

export interface EggActionOutcome {
  state: GameState;
  gained: number;
  message: string;
}

export function performEggAction(state: GameState, action: EggAction, now: number): EggActionOutcome {
  if (state.phase !== 'egg' || !getActionStatus(state, action, now).ready) {
    return { state, gained: 0, message: '' };
  }
  const { gain } = GAME_CONFIG.eggActions[action];
  const before = state.egg.hatchProgress;
  const withCooldown: GameState = {
    ...state,
    egg: { ...state.egg, lastActionAt: { ...state.egg.lastActionAt, [action]: now } },
  };
  const next = addProgress(withCooldown, gain, now);

  const crossed = GAME_CONFIG.milestones.filter((m) => before < m && next.egg.hatchProgress >= m).pop();
  const lines = ACTION_MESSAGES[action];
  const message = crossed !== undefined ? MILESTONE_MESSAGES[crossed] : lines[Math.floor(now / 1000) % lines.length];
  return { state: next, gained: gain, message };
}

/** Slow background warming. Returns the same object when nothing changed. */
export function applyPassiveProgress(state: GameState, now: number): GameState {
  if (state.phase !== 'egg') return state;
  const { pointsPerMinute, maxCatchUpPoints } = GAME_CONFIG.passive;
  const elapsedMin = Math.max(0, now - state.egg.lastTickAt) / 60_000;
  const raw = elapsedMin * pointsPerMinute;
  const whole = Math.floor(Math.min(raw, maxCatchUpPoints));
  if (whole < 1) return state;
  const capped = raw > maxCatchUpPoints;
  const lastTickAt = capped ? now : state.egg.lastTickAt + (whole / pointsPerMinute) * 60_000;
  return addProgress({ ...state, egg: { ...state.egg, lastTickAt } }, whole, now);
}

/** Dev helper (used by the dev-only "skip" button). */
export function setHatchProgress(state: GameState, value: number, now: number): GameState {
  if (state.phase !== 'egg') return state;
  return addProgress(state, value - state.egg.hatchProgress, now);
}
