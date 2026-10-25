import type { FoodDefinition, FoodId, Pet } from '@/types';
import { createRng } from '@/utils/rng';

/** ADD A FOOD: append here (and a sprite in src/pixel/props.ts). No inventory in v0.2 — food is unlimited, gated by cooldowns. */
export const FOODS: Record<FoodId, FoodDefinition> = {
  apple: { id: 'apple', name: 'Apple', hungerRestored: 15, happinessBonus: 2, rarity: 'common',   cooldownMs: 10_000 },
  berry: { id: 'berry', name: 'Berry', hungerRestored: 10, happinessBonus: 5, rarity: 'common',   cooldownMs: 10_000 },
  meat:  { id: 'meat',  name: 'Meat',  hungerRestored: 30, happinessBonus: 3, rarity: 'uncommon', cooldownMs: 40_000 },
  fish:  { id: 'fish',  name: 'Fish',  hungerRestored: 40, happinessBonus: 6, rarity: 'rare',     cooldownMs: 90_000 },
};

export const FOOD_IDS = Object.keys(FOODS);

export function getFood(id: FoodId): FoodDefinition | undefined {
  return FOODS[id];
}

/** Every pet has a favourite, derived from its id — no save data needed. */
export const favoriteFood = (pet: Pet): FoodId => createRng(pet.id).fork('favorite-food').pick(FOOD_IDS);
