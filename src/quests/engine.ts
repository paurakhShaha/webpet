import type { GameState, QuestDefinition, QuestProgress } from '@/types';
import { localDay } from '@/game/friendship';
import { createRng } from '@/utils/rng';
import { worldAt } from '@/world/clock';
import { QUESTS, getQuest } from './definitions';

export const DAILY_COUNT = 3;
export const WEEKLY_COUNT = 2;

export const counterOf = (state: GameState, metric: string) => state.progress.counters[metric] ?? 0;

export interface ObjectiveView { label: string; value: number; target: number }
export interface QuestView {
  def: QuestDefinition;
  progress: QuestProgress;
  objectives: ObjectiveView[];
  complete: boolean;
  claimed: boolean;
}

/** Progress is derived: how far each counter has moved since the quest began. Nothing to keep in sync. */
export function viewQuest(state: GameState, qp: QuestProgress): QuestView | null {
  const def = getQuest(qp.id);
  if (!def) return null;
  const objectives = def.objectives.map((o) => ({
    label: o.label,
    target: o.target,
    value: Math.max(0, Math.min(o.target, counterOf(state, o.metric) - (qp.baseline[o.metric] ?? 0))),
  }));
  return { def, progress: qp, objectives, complete: objectives.every((o) => o.value >= o.target), claimed: qp.claimedAt !== null };
}

export const activeQuests = (state: GameState): QuestView[] =>
  Object.values(state.quests.active).map((qp) => viewQuest(state, qp)).filter((v): v is QuestView => !!v);

export const claimableCount = (state: GameState): number => activeQuests(state).filter((q) => q.complete && !q.claimed).length;

/** Monday of the current week, as a local date string. */
export function weekKey(now: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDay(d.getTime());
}

function pick(type: 'daily' | 'weekly', key: string, petId: string, level: number, count: number): QuestDefinition[] {
  const pool = QUESTS.filter((q) => q.type === type && (q.minLevel ?? 1) <= level);
  return createRng(`${type}:${key}:${petId}`).shuffle(pool).slice(0, count);
}

const freshProgress = (id: string, now: number, counters: Record<string, number>): QuestProgress => ({
  id, startedAt: now, baseline: { ...counters }, claimedAt: null,
});

/**
 * Keeps the quest list current: rolls over daily and weekly quests, and opens story, exploration and goal quests
 * once their requirements are met. Safe to call any time; returns the same object when nothing changes.
 */
export function syncQuests(state: GameState, now: number): GameState {
  const pet = state.pet;
  if (!pet || state.phase !== 'pet') return state;
  let { active, claimed, dailyDay, weeklyKey } = state.quests;
  let changed = false;
  const next = { ...active };

  const rollover = (type: 'daily' | 'weekly', key: string, count: number) => {
    for (const id of Object.keys(next)) if (getQuest(id)?.type === type) delete next[id];
    for (const def of pick(type, key, pet.id, pet.level, count)) next[def.id] = freshProgress(def.id, now, state.progress.counters);
    changed = true;
  };

  const day = localDay(now);
  if (dailyDay !== day) { rollover('daily', day, DAILY_COUNT); dailyDay = day; }
  const week = weekKey(now);
  if (weeklyKey !== week) { rollover('weekly', week, WEEKLY_COUNT); weeklyKey = week; }

  // Open long-running quests as soon as they're available. Past progress counts, so veterans aren't punished.
  for (const def of QUESTS) {
    if (def.type === 'daily' || def.type === 'weekly' || next[def.id] || claimed.includes(def.id)) continue;
    if ((def.minLevel ?? 1) > pet.level) continue;
    if (def.requires?.some((r) => !claimed.includes(r))) continue;
    if (def.requiresFlag && !state.progress.flags.includes(def.requiresFlag)) continue;
    if (def.giver && !state.progress.flags.includes(`met:${def.giver}`)) continue;
    // Quests tied to the world (night only, rainy days…) are offered when the world is right, and then stay.
    if (def.when) {
      const w = worldAt(state.world, now);
      const ok = (!def.when.time || def.when.time.includes(w.time)) && (!def.when.weather || def.when.weather.includes(w.weather)) && (!def.when.season || def.when.season.includes(w.season));
      if (!ok) continue;
    }
    // World-tied quests start counting from when they appear; the others count past progress too.
    next[def.id] = { id: def.id, startedAt: now, baseline: def.when ? { ...state.progress.counters } : {}, claimedAt: null };
    changed = true;
  }

  if (!changed) return state;
  active = next;
  return { ...state, quests: { active, claimed, dailyDay, weeklyKey } };
}
