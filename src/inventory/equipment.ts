import type { Boost, CombatStats, Equipment, EquipSlot, ItemDefinition, Pet } from '@/types';
import { ITEMS } from './catalog';

export const EQUIP_SLOTS: readonly { id: EquipSlot; label: string }[] = [
  { id: 'weapon', label: 'Weapon' },
  { id: 'armor', label: 'Armor' },
  { id: 'accessory', label: 'Accessory' },
  { id: 'charm', label: 'Charm' },
];

export const emptyEquipment = (): Equipment => ({ weapon: null, armor: null, accessory: null, charm: null });

/** Which slot an item goes in, or null if it can't be equipped for stats (food, materials, cosmetics…). */
export function slotOf(item: ItemDefinition): EquipSlot | null {
  const slot = item.metadata.slot;
  return slot && slot !== 'cosmetic' ? slot : null;
}
export const isCosmetic = (item: ItemDefinition) => item.metadata.slot === 'cosmetic';

/** Sum of every stat bonus from the gear a pet is wearing. */
export function equipmentBonus(equipment: Equipment): Partial<CombatStats> {
  const out: Partial<CombatStats> = {};
  for (const id of Object.values(equipment)) {
    if (!id || !ITEMS[id]) continue;
    for (const e of ITEMS[id].effects) if (e.kind === 'stat') out[e.stat] = (out[e.stat] ?? 0) + e.amount;
  }
  return out;
}

export function boostBonus(boosts: Boost[]): Partial<CombatStats> {
  const out: Partial<CombatStats> = {};
  for (const b of boosts) out[b.stat] = (out[b.stat] ?? 0) + b.amount;
  return out;
}

export const meetsLevel = (pet: Pet, item: ItemDefinition) => pet.level >= (item.metadata.levelRequired ?? 1);
