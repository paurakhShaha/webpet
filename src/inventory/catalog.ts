import type { FoodDefinition, ItemDefinition, ItemEffect, ItemId, ItemMetadata, ItemType, Rarity } from '@/types';
import { FOODS } from '@/game/foods';

// ONE catalog for every item in the game. Add an item here and it can be found, bought, sold, equipped or used.
// Quantities are not part of the definition — what you own is `state.inventory.items[id]`.

type Seed = {
  id: ItemId; name: string; description: string; rarity: Rarity; icon: string; sellValue: number;
  effects?: ItemEffect[]; metadata?: ItemMetadata;
};

const make = (type: ItemType) => (s: Seed): ItemDefinition => ({ effects: [], metadata: {}, ...s, type });
const material = make('material');
const equipment = make('equipment');
const accessory = make('accessory');
const special = make('special');

// Food stays defined by `FOODS` (game/foods.ts) so feeding numbers live in one place.
const FOOD_META: Record<string, { icon: string; sellValue: number; price: number; description: string }> = {
  apple: { icon: 'apple', sellValue: 3, price: 8, description: 'Crisp and simple. A good everyday snack.' },
  berry: { icon: 'cherry', sellValue: 3, price: 8, description: 'Small, sweet and very popular.' },
  meat: { icon: 'drumstick', sellValue: 9, price: 24, description: 'A hearty meal that keeps them going.' },
  fish: { icon: 'fish', sellValue: 18, price: 48, description: 'A special treat. Most pets go wild for it.' },
};

const food = (f: FoodDefinition): ItemDefinition => ({
  id: f.id,
  name: f.name,
  description: FOOD_META[f.id]?.description ?? f.name,
  type: 'food',
  rarity: f.rarity,
  icon: FOOD_META[f.id]?.icon ?? 'apple',
  effects: [{ kind: 'hunger', amount: f.hungerRestored }, { kind: 'happiness', amount: f.happinessBonus }],
  sellValue: FOOD_META[f.id]?.sellValue ?? 1,
  metadata: { shopPrice: FOOD_META[f.id]?.price },
});

const list: ItemDefinition[] = [
  ...Object.values(FOODS).map(food),

  // ── Materials (found on adventures) ──
  material({ id: 'ancient-wood', name: 'Ancient Wood', description: 'Dense, old timber with a faint hum.', rarity: 'common', icon: 'tree-pine', sellValue: 5, metadata: { shopPrice: 15 } }),
  material({ id: 'healing-herb', name: 'Healing Herb', description: 'Smells like a clean morning.', rarity: 'common', icon: 'leaf', sellValue: 5, metadata: { shopPrice: 15 } }),
  material({ id: 'moon-mushroom', name: 'Moon Mushroom', description: 'Glows softly after dark.', rarity: 'uncommon', icon: 'moon', sellValue: 14, metadata: { shopPrice: 42 } }),
  material({ id: 'forest-crystal', name: 'Forest Crystal', description: 'Green light, caught mid-blink.', rarity: 'rare', icon: 'gem', sellValue: 45 }),
  material({ id: 'iron-ore', name: 'Iron Ore', description: 'Heavy and honest.', rarity: 'common', icon: 'mountain', sellValue: 6, metadata: { shopPrice: 18 } }),
  material({ id: 'raw-crystal', name: 'Raw Crystal', description: 'Uncut, and already pretty.', rarity: 'common', icon: 'diamond', sellValue: 7, metadata: { shopPrice: 21 } }),
  material({ id: 'glowstone', name: 'Glowstone', description: 'Warm to hold, even in the cold.', rarity: 'uncommon', icon: 'sparkles', sellValue: 16, metadata: { shopPrice: 48 } }),
  material({ id: 'star-geode', name: 'Star Geode', description: 'Crack it open and the night sky falls out.', rarity: 'rare', icon: 'star', sellValue: 55 }),
  material({ id: 'old-coin', name: 'Old Coin', description: 'From a kingdom no one remembers.', rarity: 'common', icon: 'coins', sellValue: 8, metadata: { shopPrice: 24 } }),
  material({ id: 'rune-fragment', name: 'Rune Fragment', description: 'Part of a word. Part of a spell.', rarity: 'uncommon', icon: 'scroll-text', sellValue: 18 }),
  material({ id: 'relic-shard', name: 'Relic Shard', description: 'It fits somewhere. You just can\u2019t tell where.', rarity: 'rare', icon: 'puzzle', sellValue: 60 }),
  material({ id: 'sun-idol', name: 'Sun Idol', description: 'Still warm from a sun that set long ago.', rarity: 'epic', icon: 'sun', sellValue: 150 }),

  // ── Weapons ──
  equipment({ id: 'rusty-sword', name: 'Rusty Sword', description: 'Seen better days, but still a sword.', rarity: 'common', icon: 'sword', sellValue: 12, effects: [{ kind: 'stat', stat: 'attack', amount: 3 }], metadata: { slot: 'weapon', levelRequired: 1, shopPrice: 45 } }),
  equipment({ id: 'oak-staff', name: 'Oak Staff', description: 'Hums when held close to the heart.', rarity: 'common', icon: 'wand', sellValue: 12, effects: [{ kind: 'stat', stat: 'magic', amount: 4 }], metadata: { slot: 'weapon', levelRequired: 1, shopPrice: 45 } }),
  equipment({ id: 'iron-blade', name: 'Iron Blade', description: 'Balanced, sharp and reliable.', rarity: 'uncommon', icon: 'sword', sellValue: 45, effects: [{ kind: 'stat', stat: 'attack', amount: 7 }], metadata: { slot: 'weapon', levelRequired: 5, shopPrice: 160 } }),
  equipment({ id: 'crystal-wand', name: 'Crystal Wand', description: 'The crystal pulses with the wielder\u2019s mood.', rarity: 'uncommon', icon: 'wand', sellValue: 45, effects: [{ kind: 'stat', stat: 'magic', amount: 8 }], metadata: { slot: 'weapon', levelRequired: 5, shopPrice: 160 } }),
  equipment({ id: 'glow-lance', name: 'Glow Lance', description: 'Lit from within by a captured glowstone.', rarity: 'rare', icon: 'sword', sellValue: 140, effects: [{ kind: 'stat', stat: 'attack', amount: 12 }, { kind: 'stat', stat: 'speed', amount: 2 }], metadata: { slot: 'weapon', levelRequired: 8 } }),

  // ── Armor ──
  equipment({ id: 'padded-vest', name: 'Padded Vest', description: 'Soft, warm and just a bit tough.', rarity: 'common', icon: 'shirt', sellValue: 10, effects: [{ kind: 'stat', stat: 'defense', amount: 2 }, { kind: 'stat', stat: 'hp', amount: 4 }], metadata: { slot: 'armor', levelRequired: 1, shopPrice: 40 } }),
  equipment({ id: 'forest-cloak', name: 'Forest Cloak', description: 'Woven from leaves that never wilt.', rarity: 'uncommon', icon: 'shield', sellValue: 40, effects: [{ kind: 'stat', stat: 'defense', amount: 4 }], metadata: { slot: 'armor', levelRequired: 3, shopPrice: 130 } }),
  equipment({ id: 'iron-plate', name: 'Iron Plate', description: 'Heavy, but it takes the hits for you.', rarity: 'uncommon', icon: 'shield-plus', sellValue: 60, effects: [{ kind: 'stat', stat: 'defense', amount: 8 }, { kind: 'stat', stat: 'hp', amount: 10 }], metadata: { slot: 'armor', levelRequired: 5, shopPrice: 220 } }),
  equipment({ id: 'ruin-mantle', name: 'Ruin Mantle', description: 'Faintly glowing runes ripple along the hem.', rarity: 'rare', icon: 'shield-plus', sellValue: 160, effects: [{ kind: 'stat', stat: 'defense', amount: 12 }, { kind: 'stat', stat: 'magic', amount: 4 }], metadata: { slot: 'armor', levelRequired: 12 } }),

  // ── Accessories and charms (change stats) ──
  accessory({ id: 'moon-pendant', name: 'Moon Pendant', description: 'A little silver moon on a thread of light.', rarity: 'uncommon', icon: 'moon', sellValue: 35, effects: [{ kind: 'stat', stat: 'luck', amount: 5 }], metadata: { slot: 'accessory', levelRequired: 2, shopPrice: 120 } }),
  accessory({ id: 'swift-anklet', name: 'Swift Anklet', description: 'Makes every step a little lighter.', rarity: 'common', icon: 'footprints', sellValue: 16, effects: [{ kind: 'stat', stat: 'speed', amount: 3 }], metadata: { slot: 'accessory', levelRequired: 1, shopPrice: 60 } }),
  accessory({ id: 'glow-ring', name: 'Glow Ring', description: 'Warm to the touch, bright in the dark.', rarity: 'rare', icon: 'circle-dot', sellValue: 90, effects: [{ kind: 'stat', stat: 'magic', amount: 6 }, { kind: 'stat', stat: 'luck', amount: 2 }], metadata: { slot: 'accessory', levelRequired: 8, shopPrice: 320 } }),
  accessory({ id: 'four-leaf-charm', name: 'Four-Leaf Charm', description: 'Found on the one lucky day.', rarity: 'common', icon: 'clover', sellValue: 14, effects: [{ kind: 'stat', stat: 'luck', amount: 3 }], metadata: { slot: 'charm', levelRequired: 1, shopPrice: 55 } }),
  accessory({ id: 'bear-tooth-charm', name: 'Bear Tooth Charm', description: 'Said to make the wearer hardier.', rarity: 'uncommon', icon: 'heart-pulse', sellValue: 34, effects: [{ kind: 'stat', stat: 'hp', amount: 14 }], metadata: { slot: 'charm', levelRequired: 3, shopPrice: 130 } }),
  accessory({ id: 'sun-charm', name: 'Sun Charm', description: 'A small, steady warmth. A true keepsake.', rarity: 'epic', icon: 'sun', sellValue: 200, effects: [{ kind: 'stat', stat: 'attack', amount: 5 }, { kind: 'stat', stat: 'magic', amount: 5 }], metadata: { slot: 'charm', levelRequired: 10 } }),

  // ── Cosmetics (accessories that only change looks) ──
  accessory({ id: 'red-bow', name: 'Red Bow', description: 'A cheerful bow for any occasion.', rarity: 'common', icon: 'ribbon', sellValue: 20, metadata: { slot: 'cosmetic', levelRequired: 1, shopPrice: 60 } }),
  accessory({ id: 'flower-clip', name: 'Flower Clip', description: 'A little flower, freshly picked.', rarity: 'common', icon: 'flower', sellValue: 28, metadata: { slot: 'cosmetic', levelRequired: 2, shopPrice: 90 } }),
  accessory({ id: 'leaf-crown', name: 'Leaf Crown', description: 'Worn like royalty of the forest.', rarity: 'uncommon', icon: 'crown', sellValue: 40, metadata: { slot: 'cosmetic', levelRequired: 4, shopPrice: 130 } }),
  accessory({ id: 'cozy-scarf', name: 'Cozy Scarf', description: 'Knitted with care. Very warm.', rarity: 'uncommon', icon: 'shirt', sellValue: 50, metadata: { slot: 'cosmetic', levelRequired: 6, shopPrice: 160 } }),
  accessory({ id: 'star-clip', name: 'Star Clip', description: 'A tiny star that never fades.', rarity: 'rare', icon: 'star', sellValue: 120, metadata: { slot: 'cosmetic', levelRequired: 8, shopPrice: 400 } }),

  // ── Seasonal and weather finds ──
  material({ id: 'spring-blossom', name: 'Spring Blossom', description: 'Only blooms in spring. Smells like hope.', rarity: 'uncommon', icon: 'flower', sellValue: 14 }),
  material({ id: 'sun-petal', name: 'Sun Petal', description: 'A summer flower that holds the heat of the day.', rarity: 'uncommon', icon: 'sun', sellValue: 14 }),
  material({ id: 'amber-leaf', name: 'Amber Leaf', description: 'An autumn leaf that glows like honey.', rarity: 'uncommon', icon: 'leaf', sellValue: 14 }),
  material({ id: 'frost-lily', name: 'Frost Lily', description: 'A winter bloom, cold and perfect.', rarity: 'uncommon', icon: 'snowflake', sellValue: 14 }),
  material({ id: 'rainbloom', name: 'Rainbloom', description: 'A rare herb that only opens when it rains.', rarity: 'rare', icon: 'droplet', sellValue: 60 }),
  material({ id: 'dawn-lily', name: 'Dawn Lily', description: 'Blooms once in a long while, and only for a few hours.', rarity: 'rare', icon: 'flower', sellValue: 70 }),
  material({ id: 'lantern-feather', name: 'Lantern Feather', description: 'Left behind by a creature with eyes like lanterns.', rarity: 'uncommon', icon: 'feather', sellValue: 40 }),

  // ── Sunken Coast ──
  material({ id: 'sea-glass', name: 'Sea Glass', description: 'Worn smooth by a thousand tides.', rarity: 'common', icon: 'gem', sellValue: 9 }),
  material({ id: 'kelp-silk', name: 'Kelp Silk', description: 'Surprisingly soft, and always a little damp.', rarity: 'common', icon: 'waves', sellValue: 10 }),
  material({ id: 'pearl', name: 'Pearl', description: 'Round, pale and quietly proud of it.', rarity: 'uncommon', icon: 'circle-dot', sellValue: 26 }),
  material({ id: 'tide-crystal', name: 'Tide Crystal', description: 'It rises and falls, like it is breathing.', rarity: 'rare', icon: 'diamond', sellValue: 75 }),

  // ── Dragon Peaks ──
  material({ id: 'peak-iron', name: 'Peak Iron', description: 'Cold metal from the thin air up high.', rarity: 'common', icon: 'mountain', sellValue: 12 }),
  material({ id: 'dragon-scale', name: 'Dragon Scale', description: 'Warm, and a little bit proud.', rarity: 'uncommon', icon: 'shield', sellValue: 30 }),
  material({ id: 'ember-core', name: 'Ember Core', description: 'A coal that never quite goes out.', rarity: 'rare', icon: 'flame', sellValue: 90 }),
  material({ id: 'dragon-fang', name: 'Dragon Fang', description: 'A gift, not a trophy. Probably.', rarity: 'epic', icon: 'sparkles', sellValue: 200 }),

  // ── Cosmic Rift ──
  material({ id: 'stardust', name: 'Stardust', description: 'Falls upward, if you let it.', rarity: 'uncommon', icon: 'sparkles', sellValue: 28 }),
  material({ id: 'void-shard', name: 'Void Shard', description: 'A piece of nowhere. Handle with curiosity.', rarity: 'rare', icon: 'diamond', sellValue: 100 }),
  material({ id: 'meteor-shard', name: 'Meteor Shard', description: 'Still warm from the sky.', rarity: 'epic', icon: 'star', sellValue: 220 }),
  material({ id: 'rift-pearl', name: 'Rift Pearl', description: 'It holds a very small, very far-away night.', rarity: 'legendary', icon: 'circle-dot', sellValue: 500 }),

  // ── Mysterious objects (found by exploring) ──
  special({ id: 'strange-compass', name: 'Strange Compass', description: 'It never points north. It points somewhere interesting.', rarity: 'rare', icon: 'compass', sellValue: 0, metadata: { unsellable: true } }),
  special({ id: 'tide-chart', name: 'Tide Chart', description: 'A faded map of tides and a coast that is not on any other map.', rarity: 'rare', icon: 'map', sellValue: 0, metadata: { unsellable: true } }),

  // ── More gear: shop (mid levels) ──
  equipment({ id: 'steel-blade', name: 'Steel Blade', description: 'Well made, well balanced, well loved.', rarity: 'uncommon', icon: 'sword', sellValue: 110, effects: [{ kind: 'stat', stat: 'attack', amount: 11 }], metadata: { slot: 'weapon', levelRequired: 10, shopPrice: 380 } }),
  equipment({ id: 'sage-staff', name: 'Sage Staff', description: 'Hums a note only the wielder can hear.', rarity: 'uncommon', icon: 'wand', sellValue: 110, effects: [{ kind: 'stat', stat: 'magic', amount: 12 }], metadata: { slot: 'weapon', levelRequired: 10, shopPrice: 380 } }),
  equipment({ id: 'steel-plate', name: 'Steel Plate', description: 'Heavy, polished, and dependable.', rarity: 'uncommon', icon: 'shield-plus', sellValue: 120, effects: [{ kind: 'stat', stat: 'defense', amount: 12 }, { kind: 'stat', stat: 'hp', amount: 14 }], metadata: { slot: 'armor', levelRequired: 10, shopPrice: 420 } }),
  equipment({ id: 'dragonhide-vest', name: 'Dragonhide Vest', description: 'Light as cloth, tough as a wall.', rarity: 'rare', icon: 'shield-plus', sellValue: 260, effects: [{ kind: 'stat', stat: 'defense', amount: 18 }, { kind: 'stat', stat: 'hp', amount: 12 }], metadata: { slot: 'armor', levelRequired: 20, shopPrice: 900 } }),

  // ── More gear: found in new regions ──
  equipment({ id: 'coral-trident', name: 'Coral Trident', description: 'Carved from living coral. It hums like the sea.', rarity: 'rare', icon: 'sword', sellValue: 240, effects: [{ kind: 'stat', stat: 'attack', amount: 16 }, { kind: 'stat', stat: 'speed', amount: 2 }], metadata: { slot: 'weapon', levelRequired: 16 } }),
  equipment({ id: 'tide-mail', name: 'Tide Mail', description: 'Scales that shed water like rain.', rarity: 'rare', icon: 'shield', sellValue: 250, effects: [{ kind: 'stat', stat: 'defense', amount: 15 }, { kind: 'stat', stat: 'hp', amount: 16 }], metadata: { slot: 'armor', levelRequired: 16 } }),
  accessory({ id: 'pearl-necklace', name: 'Pearl Necklace', description: 'Strung by someone who loved the sea.', rarity: 'rare', icon: 'circle-dot', sellValue: 220, effects: [{ kind: 'stat', stat: 'luck', amount: 8 }, { kind: 'stat', stat: 'magic', amount: 4 }], metadata: { slot: 'accessory', levelRequired: 16 } }),
  equipment({ id: 'ember-blade', name: 'Ember Blade', description: 'The edge glows when it is happy.', rarity: 'rare', icon: 'sword', sellValue: 340, effects: [{ kind: 'stat', stat: 'attack', amount: 20 }], metadata: { slot: 'weapon', levelRequired: 22 } }),
  equipment({ id: 'dragon-scale-mail', name: 'Dragon Scale Mail', description: 'Made from scales shed, never taken.', rarity: 'epic', icon: 'shield-plus', sellValue: 520, effects: [{ kind: 'stat', stat: 'defense', amount: 22 }, { kind: 'stat', stat: 'hp', amount: 20 }], metadata: { slot: 'armor', levelRequired: 22 } }),
  accessory({ id: 'dragon-fang-charm', name: 'Dragon Fang Charm', description: 'A small fang on a braided cord. Very warm.', rarity: 'epic', icon: 'heart-pulse', sellValue: 480, effects: [{ kind: 'stat', stat: 'attack', amount: 7 }, { kind: 'stat', stat: 'hp', amount: 20 }], metadata: { slot: 'charm', levelRequired: 24 } }),
  equipment({ id: 'star-staff', name: 'Star Staff', description: 'Topped with a captured star. It tends to wander.', rarity: 'epic', icon: 'wand', sellValue: 700, effects: [{ kind: 'stat', stat: 'magic', amount: 26 }], metadata: { slot: 'weapon', levelRequired: 30 } }),
  equipment({ id: 'void-cloak', name: 'Void Cloak', description: 'It is not quite there, and neither are hits.', rarity: 'epic', icon: 'shield', sellValue: 720, effects: [{ kind: 'stat', stat: 'defense', amount: 16 }, { kind: 'stat', stat: 'magic', amount: 10 }, { kind: 'stat', stat: 'speed', amount: 4 }], metadata: { slot: 'armor', levelRequired: 30 } }),

  // ── Sold only by the Mystery Traveler ──
  equipment({ id: 'wanderer-cloak', name: 'Wanderer\u2019s Cloak', description: 'It smells of far places and campfires.', rarity: 'rare', icon: 'shield', sellValue: 200, effects: [{ kind: 'stat', stat: 'defense', amount: 10 }, { kind: 'stat', stat: 'speed', amount: 4 }], metadata: { slot: 'armor', levelRequired: 8, shopPrice: 520, vendor: 'traveler' } }),
  accessory({ id: 'lucky-coin-charm', name: 'Lucky Coin Charm', description: 'Always lands on the side you were hoping for.', rarity: 'rare', icon: 'coins', sellValue: 190, effects: [{ kind: 'stat', stat: 'luck', amount: 9 }], metadata: { slot: 'charm', levelRequired: 8, shopPrice: 480, vendor: 'traveler' } }),
  special({ id: 'dream-tonic', name: 'Dream Tonic', description: 'Luck +6 and Magic +6 on the next adventure.', rarity: 'rare', icon: 'flask', sellValue: 80, effects: [{ kind: 'boost', stat: 'luck', amount: 6 }, { kind: 'boost', stat: 'magic', amount: 6 }], metadata: { levelRequired: 6, shopPrice: 260, vendor: 'traveler' } }),
  special({ id: 'moon-tonic', name: 'Moon Tonic', description: 'Speed +6 and Attack +4 on the next adventure.', rarity: 'rare', icon: 'flask', sellValue: 80, effects: [{ kind: 'boost', stat: 'speed', amount: 6 }, { kind: 'boost', stat: 'attack', amount: 4 }], metadata: { levelRequired: 6, shopPrice: 260, vendor: 'traveler' } }),

  // ── Special items ──
  special({ id: 'energy-tonic', name: 'Energy Tonic', description: 'Restores 30 energy right away.', rarity: 'uncommon', icon: 'flask', sellValue: 25, effects: [{ kind: 'energy', amount: 30 }], metadata: { levelRequired: 4, shopPrice: 90 } }),
  special({ id: 'luck-tonic', name: 'Lucky Tonic', description: 'Luck +8 on the next adventure.', rarity: 'uncommon', icon: 'flask', sellValue: 22, effects: [{ kind: 'boost', stat: 'luck', amount: 8 }], metadata: { levelRequired: 3, shopPrice: 80 } }),
  special({ id: 'warrior-tonic', name: 'Warrior Tonic', description: 'Attack +5 and Defense +3 on the next adventure.', rarity: 'uncommon', icon: 'flask', sellValue: 30, effects: [{ kind: 'boost', stat: 'attack', amount: 5 }, { kind: 'boost', stat: 'defense', amount: 3 }], metadata: { levelRequired: 5, shopPrice: 110 } }),
];

export const ITEMS: Record<ItemId, ItemDefinition> = Object.fromEntries(list.map((i) => [i.id, i]));

export function getItem(id: ItemId): ItemDefinition {
  const item = ITEMS[id];
  if (!item) throw new Error(`Unknown item: ${id}`);
  return item;
}

export const ITEM_TYPES: readonly { id: ItemType; label: string }[] = [
  { id: 'food', label: 'Food' },
  { id: 'material', label: 'Materials' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'accessory', label: 'Accessories' },
  { id: 'special', label: 'Special' },
];
