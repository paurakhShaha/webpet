import type { DurationId, Rarity } from '@/types';

const MIN = 60_000;

/** Duration options, with the energy each one costs. */
export const DURATIONS: readonly { id: DurationId; label: string; short: string; ms: number; energy: number }[] = [
  { id: '15m', label: '15 minutes', short: '15m', ms: 15 * MIN, energy: 10 },
  { id: '30m', label: '30 minutes', short: '30m', ms: 30 * MIN, energy: 15 },
  { id: '1h', label: '1 hour', short: '1h', ms: 60 * MIN, energy: 20 },
  { id: '2h', label: '2 hours', short: '2h', ms: 120 * MIN, energy: 30 },
  { id: '4h', label: '4 hours', short: '4h', ms: 240 * MIN, energy: 40 },
  { id: '8h', label: '8 hours', short: '8h', ms: 480 * MIN, energy: 55 },
];

export const getDuration = (id: DurationId) => DURATIONS.find((d) => d.id === id)!;

/** All adventure balance lives here. */
export const ADVENTURE_CONFIG = {
  /** Fights per hour of adventuring (±variance). 2 hours ≈ 7 enemies. */
  battlesPerHour: 3.5,
  battleVariance: 0.6,
  /** The pet recovers a little after every fight and a lot at each camp. */
  restHealFraction: 0.18,
  campEvery: 6,
  campHealFraction: 0.5,

  /** Turning back is never devastating: a fraction of what was earned, never rare treasure. */
  retreat: { rewardFraction: 0.35, minXp: 3, minGold: 5 },
  /** Finish above this health (as a fraction) for a "triumph". */
  triumphMinHp: 0.4,
  /** Reward multipliers by outcome. */
  outcomeBonus: { triumph: 1.25, success: 1.1, retreat: 1 },
  /** Luck adds this much to every drop chance per point (so 12 luck ≈ +5%). */
  luckDropBonus: 0.004,
  /** Treasure is rolled once per adventure hour (at least once). */
  treasureRollsPerHour: 1,
  triumphTreasureBonus: 1.5,

  stats: { growthPerLevel: 0.09 },
  /** Preparing the pet matters: fed, happy, close friends do a little better. */
  condition: { hungerFullAbove: 60, hungerMin: 0.88, happyFullAbove: 70, happyMin: 0.94, happyMax: 1.04, friendshipBonus: 0.05, min: 0.8, max: 1.12 },
  affinityBonus: 1.08,

  levelUpEnergy: 15,
  returnHappiness: { triumph: 12, success: 8, retreat: 0 },
  returnFriendship: 0.5,

  historyLimit: 25,
  /** How many dry runs the preview uses to judge readiness. */
  previewRuns: 24,
} as const;

export const RARITY_SORT: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
