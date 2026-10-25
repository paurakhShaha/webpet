import type { Egg } from '@/types';
import { createRng } from '@/utils/rng';
import { rollRarity } from '@/rarity';
import { ELEMENT_IDS } from '@/pet/elements';
import { PERSONALITY_IDS } from '@/pet/personalities';
import { GAME_CONFIG } from '@/game/config';
import { EGG_POOL_IDS } from './pools';

export const STAT_KEYS = ['vitality', 'strength', 'agility', 'intellect', 'charm'] as const;

/**
 * Pure: the same seed always lays the same egg. `id` and `seed` are the only
 * random inputs and are supplied by the caller (storage layer).
 */
export function createEgg(params: { id: string; seed: string; now: number }): Egg {
  const { id, seed, now } = params;
  const rng = createRng(seed);
  return {
    id,
    createdAt: now,
    seed,
    rarity: rollRarity(rng.fork('rarity')),
    speciesPool: rng.fork('pool').pick(EGG_POOL_IDS),
    hiddenTraits: {
      elementAffinity: rng.fork('element').pick(ELEMENT_IDS),
      personalityLean: rng.fork('personality').pick(PERSONALITY_IDS),
      statBias: rng.fork('stat-bias').pick(STAT_KEYS),
      luster: rng.fork('luster').next(),
    },
    hatchProgress: 0,
    hatchRequired: GAME_CONFIG.hatchRequired,
    lastActionAt: {},
    lastTickAt: now,
  };
}
