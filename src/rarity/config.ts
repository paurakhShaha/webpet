import type { Rarity, RarityDefinition } from '@/types';

/** Lowest → highest. Order matters for comparisons. */
export const RARITY_ORDER: readonly Rarity[] = [
  'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic',
];

/**
 * Tune the whole economy from here. `weight` values are relative
 * (they don't have to add up to 100). These numbers are never shown to the player.
 */
export const RARITY_CONFIG: Record<Rarity, RarityDefinition> = {
  common:    { id: 'common',    label: 'Common',    weight: 55,  color: '#9B9B94', statMultiplier: 1.0,  traitCount: 1, aura: 0 },
  uncommon:  { id: 'uncommon',  label: 'Uncommon',  weight: 25,  color: '#7FAF8B', statMultiplier: 1.05, traitCount: 1, aura: 0.1 },
  rare:      { id: 'rare',      label: 'Rare',      weight: 12,  color: '#79B7D4', statMultiplier: 1.1,  traitCount: 2, aura: 0.25 },
  epic:      { id: 'epic',      label: 'Epic',      weight: 5,   color: '#A993D1', statMultiplier: 1.18, traitCount: 2, aura: 0.4 },
  legendary: { id: 'legendary', label: 'Legendary', weight: 2.5, color: '#E5B85C', statMultiplier: 1.28, traitCount: 3, aura: 0.6 },
  mythic:    { id: 'mythic',    label: 'Mythic',    weight: 0.5, color: '#D58BB7', statMultiplier: 1.4,  traitCount: 3, aura: 0.8 },
};
