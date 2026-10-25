import type { EggAction } from '@/types';

/** Bump when the saved shape changes, and add a step to MIGRATIONS in state.ts. */
export const SAVE_VERSION = 5;

export interface EggActionConfig {
  label: string;
  description: string;
  /** Hatch progress gained per use. */
  gain: number;
  cooldownMs: number;
}

/** All hatching balance lives here. */
export const GAME_CONFIG = {
  hatchRequired: 100,
  /** The egg warms slowly on its own, even while the browser is closed. */
  passive: { pointsPerMinute: 4, maxCatchUpPoints: 60 },
  eggActions: {
    tap:      { label: 'Tap',      description: 'A gentle knock.',            gain: 1.5, cooldownMs: 700 },
    observe:  { label: 'Observe',  description: 'Watch it closely.',          gain: 8,   cooldownMs: 10_000 },
    incubate: { label: 'Incubate', description: 'Keep it warm.',              gain: 15,  cooldownMs: 25_000 },
    wait:     { label: 'Wait',     description: 'Sit with it quietly.',       gain: 20,  cooldownMs: 60_000 },
  } satisfies Record<EggAction, EggActionConfig>,
  milestones: [25, 50, 75],
  petDefaults: {
    generation: 1,
    level: 1,
    experience: 0,
    friendship: 0,
    hunger: 75,
    happiness: 70,
    energy: 80,
  },
  limits: { friendshipMax: 100 },
  naming: { minLength: 1, maxLength: 16 },
} as const;

/** How the pet roams across web pages (content script). Pure tuning values. */
export const ROAM_CONFIG = {
  /** Screen pixels per art pixel (32 art px → 96px on the page). */
  scale: 3,
  /** Keep this far from the viewport edge. */
  margin: 6,
  /** Walking speed, px per second. */
  speed: 64,
  hopSeconds: 0.6,
  /** After resting, chance of setting off somewhere else. */
  walkChanceAfterRest: 0.7,
  minWalkDistance: 120,
  rest: { idle: [2, 5], sit: [4, 9], sleep: [8, 18] },
  restWeights: { idle: 40, sit: 35, sleep: 25 },
} as const;
