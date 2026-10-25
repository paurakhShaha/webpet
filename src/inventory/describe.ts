import type { ItemDefinition, ItemEffect } from '@/types';
import { COMBAT_STAT_LABELS } from '@/adventure/stats';

const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export function describeEffect(e: ItemEffect): string {
  switch (e.kind) {
    case 'stat': return `${COMBAT_STAT_LABELS[e.stat]} ${sign(e.amount)}`;
    case 'boost': return `${COMBAT_STAT_LABELS[e.stat]} ${sign(e.amount)} on the next adventure`;
    case 'hunger': return `${sign(e.amount)} fullness`;
    case 'happiness': return `${sign(e.amount)} happiness`;
    case 'energy': return `${sign(e.amount)} energy`;
  }
}

export const describeEffects = (item: ItemDefinition): string[] => item.effects.map(describeEffect);

export const TYPE_LABEL = { food: 'Food', material: 'Material', equipment: 'Equipment', accessory: 'Accessory', special: 'Special item' } as const;
export const SLOT_LABEL = { weapon: 'Weapon', armor: 'Armor', accessory: 'Accessory', charm: 'Charm', cosmetic: 'Style' } as const;
