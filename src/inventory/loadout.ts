import type { CombatStat, CombatStats, EquipSlot, Pet } from '@/types';
import { COMBAT_STAT_KEYS, COMBAT_STAT_LABELS, statBreakdown } from '@/adventure/stats';
import { getItem } from './catalog';
import { isCosmetic, slotOf } from './equipment';

export interface StatChange {
  stat: CombatStat;
  label: string;
  before: number;
  after: number;
  delta: number;
}

/** "Attack 12 → 17  +5": what would change if `itemId` went into its slot (or null to take it off). */
export function compareEquip(pet: Pet, slot: EquipSlot, itemId: string | null): StatChange[] {
  const before = statBreakdown(pet).total;
  const after = statBreakdown(pet, { ...pet.equipment, [slot]: itemId }).total;
  return COMBAT_STAT_KEYS.map((stat) => ({ stat, label: COMBAT_STAT_LABELS[stat], before: before[stat], after: after[stat], delta: after[stat] - before[stat] }));
}

/** The slot this item belongs to for comparison, or null for cosmetics and non-equipment. */
export function compareSlotFor(itemId: string): EquipSlot | null {
  const item = getItem(itemId);
  return isCosmetic(item) ? null : slotOf(item);
}

export type { CombatStats };
