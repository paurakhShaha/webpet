import type { GameState, QuestReward } from '@/types';
import { addGold, addItems } from '@/inventory/service';
import { grantExperience, type LevelUpInfo } from '@/progression/xp';
import { track } from '@/progression/track';
import { getQuest } from './definitions';
import { viewQuest } from './engine';

export interface ClaimReport {
  reward: QuestReward;
  levelUp: LevelUpInfo | null;
  /** e.g. "The path to the Ancient Ruins is open." */
  unlockedText: string | null;
}

/** Hands over a finished quest's reward: gold, XP, items and any story unlock. */
export function claimQuest(state: GameState, id: string, now: number): { state: GameState; report: ClaimReport | null } {
  const qp = state.quests.active[id];
  const def = getQuest(id);
  const view = qp && viewQuest(state, qp);
  if (!qp || !def || !view || !view.complete || view.claimed || !state.pet) return { state, report: null };
  const r = def.reward;

  let next = state;
  if (r.gold) next = addGold(next, r.gold);
  if (r.items) next = addItems(next, r.items);
  let levelUp: LevelUpInfo | null = null;
  if (r.xp) {
    const res = grantExperience(next.pet!, r.xp);
    next = { ...next, pet: res.pet };
    levelUp = res.levelUp;
  }
  const flags = r.flag && !next.progress.flags.includes(r.flag) ? [...next.progress.flags, r.flag] : next.progress.flags;

  // Daily and weekly quests stay on the list (marked done) until they roll over; the rest move to "claimed".
  const periodic = def.type === 'daily' || def.type === 'weekly';
  const active = { ...next.quests.active };
  if (periodic) active[id] = { ...qp, claimedAt: now };
  else delete active[id];
  next = {
    ...next,
    progress: { ...next.progress, flags },
    quests: { ...next.quests, active, claimed: periodic ? next.quests.claimed : [...next.quests.claimed, id] },
  };

  next = track(next, { 'gold-earned': r.gold ?? 0, levelups: levelUp ? levelUp.to - levelUp.from : 0 }, now);
  return { state: next, report: { reward: r, levelUp, unlockedText: r.flagText ?? null } };
}
