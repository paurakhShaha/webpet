import type { ItemDefinition, ItemId } from '@/types';
import { ITEMS } from '@/inventory/catalog';

export type ShopSection = 'food' | 'equipment' | 'tonics' | 'materials' | 'cosmetics' | 'traveler';

export const SHOP_SECTIONS: readonly { id: ShopSection; label: string; blurb: string }[] = [
  { id: 'food', label: 'Food', blurb: 'Meals, treats and tonics.' },
  { id: 'equipment', label: 'Gear', blurb: 'Basic equipment to help on adventures.' },
  { id: 'tonics', label: 'Potions', blurb: 'Tonics that help for a little while.' },
  { id: 'materials', label: 'Goods', blurb: 'Handy goods from far-off places.' },
  { id: 'cosmetics', label: 'Style', blurb: 'Little things to make your pet feel special.' },
  { id: 'traveler', label: 'Traveler', blurb: 'Unusual wares from someone who never stays long.' },
];

export interface ShopListing {
  /** Stable key, used to track purchases. */
  id: string;
  item: ItemId;
  section: ShopSection;
  price: number;
  /** How many can be bought per stock rotation. */
  stock: number;
  minLevel: number;
  /** Always on the shelf. */
  staple: boolean;
}

/** How many rotating (non-staple) listings each section shows at once. */
export const ROTATING_SLOTS: Record<ShopSection, number> = { food: 3, equipment: 4, tonics: 3, materials: 3, cosmetics: 2, traveler: 2 };
export const ROTATION_MS = 12 * 3_600_000;

const STAPLES = new Set(['apple', 'berry']);

function sectionOf(item: ItemDefinition): ShopSection | null {
  if (!item.metadata.shopPrice) return null;
  if (item.metadata.vendor === 'traveler') return 'traveler';
  if (item.type === 'special') return 'tonics';
  if (item.type === 'food') return 'food';
  if (item.type === 'equipment' || (item.type === 'accessory' && item.metadata.slot !== 'cosmetic')) return 'equipment';
  if (item.type === 'material') return 'materials';
  if (item.type === 'accessory') return 'cosmetics';
  return null;
}

function stockFor(section: ShopSection, item: ItemDefinition): number {
  if (STAPLES.has(item.id)) return 10;
  if (section === 'tonics') return 2;
  if (section === 'food') return 3;
  if (section === 'materials') return 5;
  return 1;
}

/** Built from the item catalog: give an item a `shopPrice` and it's for sale. */
export const SHOP_LISTINGS: ShopListing[] = Object.values(ITEMS).flatMap((item) => {
  const section = sectionOf(item);
  if (!section) return [];
  return [{
    id: `${section}:${item.id}`,
    item: item.id,
    section,
    price: item.metadata.shopPrice!,
    stock: stockFor(section, item),
    minLevel: item.metadata.levelRequired ?? 1,
    staple: STAPLES.has(item.id),
  }];
});

export const getListing = (id: string) => SHOP_LISTINGS.find((l) => l.id === id);
