import type { BaseStats, CombatStats, LocationDefinition, Pet } from '@/types';
import { boostBonus, equipmentBonus } from '@/inventory/equipment';
import { ADVENTURE_CONFIG as A } from './config';

export const COMBAT_STAT_KEYS = ['hp', 'attack', 'defense', 'speed', 'magic', 'luck'] as const;
export const COMBAT_STAT_LABELS: Record<keyof CombatStats, string> = {
  hp: 'HP', attack: 'Attack', defense: 'Defense', speed: 'Speed', magic: 'Magic', luck: 'Luck',
};

/** Bonus from worn gear. Kept separate from base stats and from temporary boosts. */
export function getEquipmentBonus(pet: Pet): Partial<CombatStats> {
  return equipmentBonus(pet.equipment);
}

/** The six adventure stats, derived from the pet's base stats and level. Stats grow every level. */
export function combatStatsAtLevel(base: BaseStats, level: number, bonus: Partial<CombatStats> = {}): CombatStats {
  const growth = 1 + A.stats.growthPerLevel * (level - 1);
  const raw: CombatStats = {
    hp: 24 + base.vitality * 4,
    attack: 2 + base.strength * 1.2 + base.agility * 0.3,
    defense: 1 + base.vitality * 0.5 + base.strength * 0.3,
    speed: 2 + base.agility,
    magic: 1 + base.intellect * 1.1,
    luck: 1 + base.charm * 0.9 + base.intellect * 0.2,
  };
  const out = {} as CombatStats;
  for (const key of COMBAT_STAT_KEYS) out[key] = Math.round(raw[key] * growth + (bonus[key] ?? 0));
  return out;
}

export interface StatBreakdown {
  base: CombatStats;
  equipment: CombatStats;
  temporary: CombatStats;
  total: CombatStats;
}

const full = (p: Partial<CombatStats>): CombatStats => ({
  hp: p.hp ?? 0, attack: p.attack ?? 0, defense: p.defense ?? 0, speed: p.speed ?? 0, luck: p.luck ?? 0, magic: p.magic ?? 0,
});

/** Base (from level), equipment and temporary bonuses, kept apart, plus the total used in adventures. */
export function statBreakdown(pet: Pet, equipment = pet.equipment, boosts = pet.boosts): StatBreakdown {
  const base = combatStatsAtLevel(pet.baseStats, pet.level);
  const gear = full(equipmentBonus(equipment));
  const temp = full(boostBonus(boosts));
  const total = {} as CombatStats;
  for (const k of COMBAT_STAT_KEYS) total[k] = base[k] + gear[k] + temp[k];
  return { base, equipment: gear, temporary: temp, total };
}

export const combatStats = (pet: Pet): CombatStats => statBreakdown(pet).total;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** How ready the pet is to go: fed, happy and close to you all help a little. */
export function conditionOf(pet: Pet): { multiplier: number; label: 'Excellent' | 'Good' | 'Fair' | 'Poor'; tips: string[] } {
  const c = A.condition;
  const hunger = pet.hunger >= c.hungerFullAbove ? 1 : c.hungerMin + (pet.hunger / c.hungerFullAbove) * (1 - c.hungerMin);
  const happy = pet.happiness >= c.happyFullAbove ? c.happyMax : c.happyMin + (pet.happiness / c.happyFullAbove) * (c.happyMax - c.happyMin);
  const friend = 1 + (pet.friendship / 100) * c.friendshipBonus;
  const multiplier = clamp(hunger * happy * friend, c.min, c.max);
  const tips: string[] = [];
  if (pet.hunger < 50) tips.push('Feed them before they go.');
  if (pet.happiness < 50) tips.push('A little play or grooming would lift their spirits.');
  const label = multiplier >= 1.04 ? 'Excellent' : multiplier >= 1 ? 'Good' : multiplier >= 0.95 ? 'Fair' : 'Poor';
  return { multiplier, label, tips };
}

export const affinityOf = (pet: Pet, loc: LocationDefinition) =>
  loc.favoredElement && loc.favoredElement === pet.element ? A.affinityBonus : 1;
