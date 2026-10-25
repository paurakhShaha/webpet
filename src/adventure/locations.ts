import type { DropEntry, LocationDefinition, LocationId } from '@/types';
import { getItem } from './items';
import { RARITY_SORT } from './config';

/**
 * ADD A LOCATION: append here. The world map, region page, preview and results pick it up automatically.
 * `hidden` places only appear on the map once the player discovers them (their flag is `disc:<id>`).
 * Enemies with `time` only appear at those times; drops can depend on season, time and weather.
 */

// Seasonal collectibles found in the forest, one per season.
const SEASONAL: DropEntry[] = [
  { item: 'spring-blossom', chance: 0.14, qty: [1, 2], season: ['spring'] },
  { item: 'sun-petal', chance: 0.14, qty: [1, 2], season: ['summer'] },
  { item: 'amber-leaf', chance: 0.14, qty: [1, 2], season: ['autumn'] },
  { item: 'frost-lily', chance: 0.14, qty: [1, 2], season: ['winter'] },
];

export const LOCATIONS: LocationDefinition[] = [
  // ── Whispering Forest ──────────────────────────────────────
  {
    id: 'whispering-forest', region: 'forest', name: 'Whispering Forest', icon: 'tree-pine',
    description: 'Tall old trees and soft voices between the leaves. A gentle place to learn the ropes.',
    difficulty: 'easy', riskLevel: 'low', minimumLevel: 1, enemyPower: 1.2, favoredElement: 'nature',
    durationOptions: ['15m', '30m', '1h', '2h', '4h'],
    enemyTypes: [
      { enemy: 'slime', weight: 35 }, { enemy: 'bat', weight: 25 }, { enemy: 'wolf', weight: 25 },
      { enemy: 'forest-spirit', weight: 10 }, { enemy: 'goblin', weight: 5 },
      { enemy: 'moon-moth', weight: 30, time: ['night'] }, { enemy: 'shade', weight: 12, time: ['night'] },
    ],
    rewardTable: {
      xpMultiplier: 1, goldMultiplier: 1,
      drops: [
        { item: 'ancient-wood', chance: 0.4, qty: [1, 2] },
        { item: 'healing-herb', chance: 0.35, qty: [1, 2], boost: { weather: { rain: 1.8, fog: 1.3 } } },
        { item: 'moon-mushroom', chance: 0.12, qty: [1, 1], boost: { time: { night: 2.2 }, weather: { fog: 1.5 } } },
        { item: 'berry', chance: 0.12, qty: [1, 2] },
        ...SEASONAL,
      ],
      treasure: [{ item: 'forest-crystal', chance: 0.1, qty: [1, 1] }, { item: 'forest-cloak', chance: 0.04, qty: [1, 1] }],
    },
  },
  {
    id: 'moonlit-glade', region: 'forest', hidden: true, name: 'Moonlit Glade', icon: 'moon',
    description: 'A ring of silver trees that only seems to exist after dark. The moths here are very large.',
    difficulty: 'normal', riskLevel: 'medium', minimumLevel: 3, enemyPower: 1.5, favoredElement: 'shadow', requiresFlag: 'disc:moonlit-glade',
    durationOptions: ['15m', '30m', '1h', '2h', '4h'],
    enemyTypes: [{ enemy: 'moon-moth', weight: 35 }, { enemy: 'shade', weight: 25 }, { enemy: 'slime', weight: 20 }, { enemy: 'bat', weight: 20 }],
    rewardTable: {
      xpMultiplier: 1.8, goldMultiplier: 1.6,
      drops: [
        { item: 'moon-mushroom', chance: 0.32, qty: [1, 2] },
        { item: 'healing-herb', chance: 0.25, qty: [1, 2], boost: { weather: { rain: 1.6 } } },
        { item: 'lantern-feather', chance: 0.06, qty: [1, 1], time: ['night'] },
      ],
      treasure: [{ item: 'forest-crystal', chance: 0.16, qty: [1, 1] }, { item: 'moon-pendant', chance: 0.05, qty: [1, 1] }],
    },
  },

  // ── Crystal Mine ───────────────────────────────────────────
  {
    id: 'crystal-mine', region: 'mine', name: 'Crystal Mine', icon: 'pickaxe',
    description: 'Echoing tunnels lined with glittering veins. Goblins dig here, and they do not like visitors.',
    difficulty: 'normal', riskLevel: 'medium', minimumLevel: 5, enemyPower: 1.85, favoredElement: 'earth',
    durationOptions: ['30m', '1h', '2h', '4h', '8h'],
    enemyTypes: [
      { enemy: 'goblin', weight: 35 }, { enemy: 'bat', weight: 30 }, { enemy: 'slime', weight: 20 }, { enemy: 'wolf', weight: 15 },
      { enemy: 'shade', weight: 14, time: ['night'] },
    ],
    rewardTable: {
      xpMultiplier: 3.2, goldMultiplier: 2.6,
      drops: [
        { item: 'iron-ore', chance: 0.4, qty: [1, 3] },
        { item: 'raw-crystal', chance: 0.3, qty: [1, 2], boost: { weather: { storm: 1.4 } } },
        { item: 'glowstone', chance: 0.12, qty: [1, 1], boost: { time: { night: 1.5 } } },
      ],
      treasure: [{ item: 'star-geode', chance: 0.08, qty: [1, 1] }, { item: 'glow-lance', chance: 0.03, qty: [1, 1] }],
    },
  },
  {
    id: 'echoing-cavern', region: 'mine', hidden: true, name: 'Echoing Cavern', icon: 'gem',
    description: 'A vast chamber where every sound comes back a little different. The walls hum.',
    difficulty: 'normal', riskLevel: 'medium', minimumLevel: 7, enemyPower: 2.0, favoredElement: 'earth', requiresFlag: 'disc:echoing-cavern',
    durationOptions: ['30m', '1h', '2h', '4h', '8h'],
    enemyTypes: [{ enemy: 'bat', weight: 35 }, { enemy: 'goblin', weight: 25 }, { enemy: 'slime', weight: 20 }, { enemy: 'rock-golem', weight: 20 }],
    rewardTable: {
      xpMultiplier: 3.8, goldMultiplier: 3.2,
      drops: [
        { item: 'raw-crystal', chance: 0.35, qty: [1, 3] },
        { item: 'glowstone', chance: 0.25, qty: [1, 2] },
        { item: 'iron-ore', chance: 0.3, qty: [1, 3] },
      ],
      treasure: [{ item: 'star-geode', chance: 0.12, qty: [1, 1] }],
    },
  },

  // ── Ancient Ruins ──────────────────────────────────────────
  {
    id: 'ancient-ruins', region: 'ruins', name: 'Ancient Ruins', icon: 'landmark',
    description: 'Crumbled halls older than any map. Something still watches over the place.',
    difficulty: 'hard', riskLevel: 'high', minimumLevel: 12, enemyPower: 2.4, favoredElement: 'light', requiresFlag: 'ruins-open',
    durationOptions: ['1h', '2h', '4h', '8h'],
    enemyTypes: [
      { enemy: 'goblin', weight: 30 }, { enemy: 'forest-spirit', weight: 30 }, { enemy: 'wolf', weight: 20 }, { enemy: 'bat', weight: 20 },
      { enemy: 'wraith', weight: 30, time: ['night'] },
    ],
    rewardTable: {
      xpMultiplier: 6, goldMultiplier: 5,
      drops: [
        { item: 'old-coin', chance: 0.4, qty: [1, 3] },
        { item: 'rune-fragment', chance: 0.25, qty: [1, 2], boost: { weather: { fog: 1.6 } } },
        { item: 'relic-shard', chance: 0.1, qty: [1, 1], boost: { time: { night: 1.5 } } },
      ],
      treasure: [{ item: 'sun-idol', chance: 0.06, qty: [1, 1] }, { item: 'ruin-mantle', chance: 0.04, qty: [1, 1] }],
    },
  },
  {
    id: 'sealed-vault', region: 'ruins', hidden: true, name: 'Sealed Vault', icon: 'scroll-text',
    description: 'A door that was not there yesterday. Behind it, the air is very still.',
    difficulty: 'hard', riskLevel: 'high', minimumLevel: 13, enemyPower: 2.6, favoredElement: 'light', requiresFlag: 'disc:sealed-vault',
    durationOptions: ['1h', '2h', '4h', '8h'],
    enemyTypes: [{ enemy: 'wraith', weight: 35 }, { enemy: 'goblin', weight: 20 }, { enemy: 'shade', weight: 25 }, { enemy: 'forest-spirit', weight: 20 }],
    rewardTable: {
      xpMultiplier: 6.8, goldMultiplier: 5.6,
      drops: [
        { item: 'rune-fragment', chance: 0.3, qty: [1, 2] },
        { item: 'old-coin', chance: 0.35, qty: [2, 4] },
        { item: 'relic-shard', chance: 0.15, qty: [1, 1] },
      ],
      treasure: [{ item: 'sun-idol', chance: 0.1, qty: [1, 1] }, { item: 'ruin-mantle', chance: 0.06, qty: [1, 1] }],
    },
  },

  // ── Sunken Coast ───────────────────────────────────────────
  {
    id: 'sunken-cove', region: 'coast', name: 'Sunken Cove', icon: 'waves',
    description: 'A drowned harbour, half under the waves. Lanterns still glow below the surface.',
    difficulty: 'hard', riskLevel: 'high', minimumLevel: 16, enemyPower: 3.0, favoredElement: 'water',
    durationOptions: ['1h', '2h', '4h', '8h'],
    enemyTypes: [
      { enemy: 'sea-crab', weight: 35 }, { enemy: 'tide-wisp', weight: 25 }, { enemy: 'kelp-lurker', weight: 25 }, { enemy: 'bat', weight: 15 },
      { enemy: 'shade', weight: 14, time: ['night'] },
    ],
    rewardTable: {
      xpMultiplier: 9, goldMultiplier: 7,
      drops: [
        { item: 'sea-glass', chance: 0.4, qty: [1, 3], boost: { weather: { storm: 1.5 } } },
        { item: 'kelp-silk', chance: 0.35, qty: [1, 2], boost: { weather: { rain: 1.4 } } },
        { item: 'pearl', chance: 0.15, qty: [1, 1], boost: { weather: { fog: 1.4 } } },
      ],
      treasure: [{ item: 'tide-crystal', chance: 0.08, qty: [1, 1] }, { item: 'coral-trident', chance: 0.03, qty: [1, 1] }, { item: 'tide-mail', chance: 0.03, qty: [1, 1] }],
    },
  },
  {
    id: 'tide-cave', region: 'coast', hidden: true, name: 'Tide Cave', icon: 'shell',
    description: 'A cave that only opens when the tide is far out. The pearls here are the size of apples.',
    difficulty: 'hard', riskLevel: 'high', minimumLevel: 17, enemyPower: 3.3, favoredElement: 'water', requiresFlag: 'disc:tide-cave',
    durationOptions: ['1h', '2h', '4h', '8h'],
    enemyTypes: [{ enemy: 'tide-wisp', weight: 35 }, { enemy: 'kelp-lurker', weight: 30 }, { enemy: 'sea-crab', weight: 20 }, { enemy: 'shade', weight: 15 }],
    rewardTable: {
      xpMultiplier: 10, goldMultiplier: 8,
      drops: [{ item: 'pearl', chance: 0.3, qty: [1, 2] }, { item: 'sea-glass', chance: 0.3, qty: [1, 3] }, { item: 'kelp-silk', chance: 0.25, qty: [1, 2] }],
      treasure: [{ item: 'tide-crystal', chance: 0.12, qty: [1, 1] }, { item: 'pearl-necklace', chance: 0.05, qty: [1, 1] }],
    },
  },

  // ── Dragon Peaks ───────────────────────────────────────────
  {
    id: 'ember-ridge', region: 'peaks', name: 'Ember Ridge', icon: 'flame',
    description: 'A ridge of warm black rock under a sky full of slow wings.',
    difficulty: 'hard', riskLevel: 'high', minimumLevel: 22, enemyPower: 3.3, favoredElement: 'fire',
    durationOptions: ['1h', '2h', '4h', '8h'],
    enemyTypes: [{ enemy: 'ember-imp', weight: 30 }, { enemy: 'rock-golem', weight: 25 }, { enemy: 'drake-whelp', weight: 20 }, { enemy: 'wolf', weight: 25 }],
    rewardTable: {
      xpMultiplier: 12, goldMultiplier: 9,
      drops: [
        { item: 'peak-iron', chance: 0.4, qty: [1, 3] },
        { item: 'dragon-scale', chance: 0.25, qty: [1, 2], boost: { weather: { snow: 1.4 } } },
        { item: 'ember-core', chance: 0.1, qty: [1, 1], boost: { weather: { storm: 1.5 } } },
      ],
      treasure: [{ item: 'ember-blade', chance: 0.03, qty: [1, 1] }, { item: 'dragon-scale-mail', chance: 0.02, qty: [1, 1] }, { item: 'ember-core', chance: 0.08, qty: [1, 1] }],
    },
  },
  {
    id: 'dragon-nest', region: 'peaks', hidden: true, name: 'Dragon\u2019s Nest', icon: 'bird',
    description: 'A hollow in the peak, lined with warm stone and shed scales. The owner is not rude. Just large.',
    difficulty: 'hard', riskLevel: 'high', minimumLevel: 24, enemyPower: 3.7, favoredElement: 'fire', requiresFlag: 'disc:dragon-nest',
    durationOptions: ['1h', '2h', '4h', '8h'],
    enemyTypes: [{ enemy: 'drake-whelp', weight: 40 }, { enemy: 'ember-imp', weight: 30 }, { enemy: 'rock-golem', weight: 30 }],
    rewardTable: {
      xpMultiplier: 14, goldMultiplier: 11,
      drops: [{ item: 'dragon-scale', chance: 0.35, qty: [1, 3] }, { item: 'ember-core', chance: 0.2, qty: [1, 1] }, { item: 'peak-iron', chance: 0.3, qty: [1, 3] }],
      treasure: [{ item: 'dragon-fang', chance: 0.1, qty: [1, 1] }, { item: 'dragon-fang-charm', chance: 0.04, qty: [1, 1] }],
    },
  },

  // ── Cosmic Rift ────────────────────────────────────────────
  {
    id: 'cosmic-rift', region: 'rift', name: 'The Rift', icon: 'orbit',
    description: 'A seam in the sky where the stars come close enough to touch. Gravity is more of a suggestion.',
    difficulty: 'hard', riskLevel: 'high', minimumLevel: 30, enemyPower: 3.9, favoredElement: 'shadow', requiresFlag: 'rift-open',
    durationOptions: ['2h', '4h', '8h'],
    enemyTypes: [{ enemy: 'star-wisp', weight: 35 }, { enemy: 'void-hound', weight: 30 }, { enemy: 'rift-stalker', weight: 20 }, { enemy: 'shade', weight: 15 }],
    rewardTable: {
      xpMultiplier: 18, goldMultiplier: 13,
      drops: [
        { item: 'stardust', chance: 0.4, qty: [1, 3], boost: { time: { night: 1.5 } } },
        { item: 'void-shard', chance: 0.15, qty: [1, 1] },
      ],
      treasure: [
        { item: 'meteor-shard', chance: 0.1, qty: [1, 1] }, { item: 'star-staff', chance: 0.03, qty: [1, 1] },
        { item: 'void-cloak', chance: 0.03, qty: [1, 1] }, { item: 'rift-pearl', chance: 0.02, qty: [1, 1] },
      ],
    },
  },
];

export const getLocation = (id: LocationId): LocationDefinition => {
  const loc = LOCATIONS.find((l) => l.id === id);
  if (!loc) throw new Error(`Unknown location: ${id}`);
  return loc;
};

/** The likely rewards shown in the preview, e.g. "Ancient Wood, Healing Herb, Gold". */
export function expectedRewardNames(loc: LocationDefinition): string[] {
  const common = [...loc.rewardTable.drops]
    .filter((d) => !d.season && !d.time && RARITY_SORT[getItem(d.item).rarity] <= 1 && d.chance >= 0.2)
    .map((d) => getItem(d.item).name);
  return [...common, 'Gold'];
}
