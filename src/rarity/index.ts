import type { Rarity, RarityDefinition } from '@/types';
import type { Rng } from '@/utils/rng';
import { RARITY_CONFIG, RARITY_ORDER } from './config';

export { RARITY_CONFIG, RARITY_ORDER };

export const getRarity = (id: Rarity): RarityDefinition => RARITY_CONFIG[id];
export const rarityRank = (id: Rarity): number => RARITY_ORDER.indexOf(id);
export const isRarityAtLeast = (id: Rarity, min: Rarity): boolean => rarityRank(id) >= rarityRank(min);

export function rollRarity(rng: Rng, config: Record<Rarity, RarityDefinition> = RARITY_CONFIG): Rarity {
  return rng.weighted(RARITY_ORDER, (id) => config[id].weight);
}
