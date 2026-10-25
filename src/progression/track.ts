import type { GameState } from '@/types';
import { evaluateAchievements } from '@/achievements';
import { recordMilestones } from '@/journal/journal';
import { syncQuests } from '@/quests/engine';

/** Brings quests and achievements up to date. Call after anything that could change them. */
export function syncProgression(state: GameState, now: number): GameState {
  return recordMilestones(evaluateAchievements(syncQuests(state, now), now), now);
}

/**
 * Records that things happened ("feeds": 1, "adventures:crystal-mine": 1…) in permanent lifetime counters,
 * then updates quests and achievements. Every system reports through here, so there is one source of truth.
 */
export function track(state: GameState, add: Record<string, number>, now: number): GameState {
  const counters = { ...state.progress.counters };
  for (const [metric, n] of Object.entries(add)) if (n) counters[metric] = (counters[metric] ?? 0) + n;
  return syncProgression({ ...state, progress: { ...state.progress, counters } }, now);
}
