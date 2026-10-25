import type { PersonalityId } from '@/types';

const HOUR = 3_600_000;

/** All care balance lives here. Rates are per hour of real time. */
export const CARE_CONFIG = {
  /** Never simulate more than this much away time — long absences aren't punished further. */
  maxElapsedMs: 72 * HOUR,
  /** Tiny gaps aren't worth a write. */
  minSyncMs: 10_000,
  /** Only summarise absences at least this long. */
  awaySummaryMinMs: 30 * 60_000,

  decay: {
    hunger: 3.5,
    happiness: 2,
    energy: 2.5,
    /** Extra happiness lost per hour while very hungry / very tired. */
    hungryPenalty: 1.5,
    tiredPenalty: 1,
    lowThreshold: 25,
  },
  /** Time alone can't push a stat below these, so a pet is never in danger from being offline. */
  floors: { hunger: 5, happiness: 10, energy: 5 },

  sleep: {
    energyPerHour: 14,
    hungerPerHour: 1.5,
    /** Too rested to sleep above this. */
    maxEnergyToSleep: 85,
    /** Waking early below this makes the pet groggy (dialogue only, no penalty). */
    groggyBelow: 50,
  },

  actions: {
    pet:   { cooldownMs: 20_000, happiness: 3,  friendship: 0.3, xp: 2 },
    feed:  { blockAboveHunger: 95, friendship: 0.4, favoriteFriendship: 0.2, favoriteHappiness: 5, xp: 5 },
    play:  { cooldownMs: 30_000, happiness: 12, energy: -10, hunger: -4, friendship: 0.8, xp: 8, minEnergy: 15, minHunger: 10 },
    groom: { cooldownMs: 45_000, happiness: 6,  friendship: 0.6, xp: 6 },
  },

  friendship: {
    /** Most friendship that can be earned in one local day (≈ 13 days to reach 100). */
    dailyCap: 8,
    /** Happy pets bond faster: multiplier goes from [0] at 0 happiness to [1] at 100. */
    happinessScale: [0.6, 1.4] as const,
    levels: [
      { min: 0, label: 'Stranger' },
      { min: 20, label: 'Acquaintance' },
      { min: 40, label: 'Friend' },
      { min: 60, label: 'Close Friend' },
      { min: 80, label: 'Best Friend' },
      { min: 100, label: 'Soul Companion' },
    ],
  },

  /** XP to next level = base + perLevel × level^exponent (exponent 1 = the old straight line). */
  xp: { base: 40, perLevel: 20, exponent: 1.3, maxLevel: 50 },
} as const;

export interface CareModifiers {
  play: number;
  energyCost: number;
  friendship: number;
  groom: number;
  feed: number;
}
const base: CareModifiers = { play: 1, energyCost: 1, friendship: 1, groom: 1, feed: 1 };

/** Personality nudges how much each activity helps. */
export const PERSONALITY_CARE: Record<PersonalityId, CareModifiers> = {
  brave:       { ...base, play: 1.1 },
  curious:     { ...base, friendship: 1.1 },
  playful:     { ...base, play: 1.3 },
  shy:         { ...base, play: 0.9, friendship: 1.15 },
  lazy:        { ...base, play: 0.9, energyCost: 1.5, groom: 1.3, feed: 1.2 },
  mischievous: { ...base, play: 1.2, groom: 0.8 },
  kind:        { ...base, friendship: 1.2 },
  adventurous: { ...base, play: 1.25, energyCost: 1.1 },
};
