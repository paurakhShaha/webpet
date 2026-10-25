import type { ItemStack, Rarity, RegionId, Season, Weather, WorldTime } from '@/types';

export type DiscoveryKind = 'location' | 'treasure' | 'npc' | 'resource' | 'quest' | 'object';

export interface DiscoveryDefinition {
  id: string;
  kind: DiscoveryKind;
  name: string;
  /** Journal text. {name} is the pet. */
  text: string;
  rarity: Rarity;
  regions: RegionId[];
  /** Limit to certain places within those regions. */
  locations?: string[];
  /** Chance per exploration roll, before conditions and luck. */
  chance: number;
  /** Found once, ever. Sets the flag `disc:<id>`. */
  unique?: boolean;
  when?: { time?: WorldTime[]; weather?: Weather[]; season?: Season[]; minLevel?: number; flags?: string[] };
  boost?: { time?: Partial<Record<WorldTime, number>>; weather?: Partial<Record<Weather, number>> };
  reward?: { items?: ItemStack[]; gold?: number; xp?: number };
}

/**
 * ADD A DISCOVERY: append here. Adventures roll for these along the way (see world/explore.ts).
 * Hidden places use the id of their location; NPCs use `disc:<npc>` as their `foundBy`; secret quests use `requiresFlag`.
 */
export const DISCOVERIES: DiscoveryDefinition[] = [
  // ── Whispering Forest ──
  { id: 'hollow-stump-cache', kind: 'treasure', rarity: 'uncommon', regions: ['forest'], chance: 0.09, name: 'A hidden cache', text: '{name} found a cache tucked inside a hollow stump.', reward: { gold: 45, items: [{ item: 'healing-herb', qty: 2 }] } },
  { id: 'rainbloom-patch', kind: 'resource', rarity: 'rare', regions: ['forest'], chance: 0.12, name: 'A patch of rainbloom', text: 'The rain brought out a patch of rainbloom, and {name} knew exactly where to look.', when: { weather: ['rain'] }, reward: { items: [{ item: 'rainbloom', qty: 1 }] } },
  { id: 'voice-in-the-fog', kind: 'object', rarity: 'rare', regions: ['forest'], chance: 0.1, name: 'A voice in the fog', text: 'A voice in the fog led {name} to a quiet clearing. By the time the fog lifted, the voice was gone, but something glowing was left behind.', when: { weather: ['fog'] }, reward: { items: [{ item: 'moon-mushroom', qty: 1 }, { item: 'lantern-feather', qty: 1 }], xp: 30 } },
  { id: 'moonlit-glade', kind: 'location', rarity: 'rare', regions: ['forest'], locations: ['whispering-forest'], chance: 0.05, unique: true, name: 'Moonlit Glade', text: '{name} followed a trail of silver moths and found the Moonlit Glade, a hidden place in the Whispering Forest.', when: { time: ['night'], minLevel: 3 }, boost: { weather: { clear: 1.4 } } },
  { id: 'old-explorer-camp', kind: 'npc', rarity: 'uncommon', regions: ['forest'], chance: 0.07, unique: true, name: 'An explorer\u2019s camp', text: '{name} came upon a tiny camp, and a very surprised old explorer.', when: { time: ['morning', 'day'], minLevel: 2 }, reward: { gold: 20 } },
  { id: 'explorers-note', kind: 'quest', rarity: 'uncommon', regions: ['forest'], locations: ['whispering-forest'], chance: 0.06, unique: true, name: 'A folded note', text: '{name} found a folded note, weathered and a little muddy. It mentions a place only visible after dark.', when: { flags: ['disc:old-explorer-camp'] } },

  // ── Crystal Mine ──
  { id: 'glittering-vein', kind: 'resource', rarity: 'uncommon', regions: ['mine'], chance: 0.12, name: 'A glittering vein', text: '{name} spotted a vein of crystal the miners missed.', reward: { items: [{ item: 'raw-crystal', qty: 2 }, { item: 'glowstone', qty: 1 }] } },
  { id: 'rusted-chest', kind: 'treasure', rarity: 'uncommon', regions: ['mine'], chance: 0.06, name: 'A rusted chest', text: 'Behind a fallen beam, {name} found a rusted chest. It still had something in it.', reward: { gold: 120, items: [{ item: 'iron-ore', qty: 3 }] } },
  { id: 'echoing-cavern', kind: 'location', rarity: 'rare', regions: ['mine'], locations: ['crystal-mine'], chance: 0.05, unique: true, name: 'Echoing Cavern', text: '{name} followed an echo that did not match any sound and discovered the Echoing Cavern.', when: { minLevel: 7 } },
  { id: 'mystery-traveler', kind: 'npc', rarity: 'rare', regions: ['mine', 'ruins'], chance: 0.05, unique: true, name: 'A hooded traveler', text: 'In the dark, {name} met a hooded traveler who seemed to have been waiting.', when: { time: ['night'], minLevel: 6 }, boost: { weather: { fog: 2 } } },
  { id: 'strange-compass', kind: 'object', rarity: 'rare', regions: ['mine', 'ruins'], chance: 0.06, unique: true, name: 'A strange compass', text: '{name} found a compass that does not point north. It points somewhere interesting.', when: { minLevel: 8 }, reward: { items: [{ item: 'strange-compass', qty: 1 }] } },

  // ── Ancient Ruins ──
  { id: 'sealed-vault', kind: 'location', rarity: 'rare', regions: ['ruins'], locations: ['ancient-ruins'], chance: 0.04, unique: true, name: 'Sealed Vault', text: 'A door appeared where there had been only wall. {name} had discovered the Sealed Vault.', when: { minLevel: 13 }, boost: { weather: { fog: 1.6 }, time: { night: 1.5 } } },
  { id: 'ancient-offering', kind: 'treasure', rarity: 'rare', regions: ['ruins'], chance: 0.05, name: 'An old offering', text: '{name} found an offering left on an altar a thousand years ago. It was still warm.', reward: { gold: 300, items: [{ item: 'relic-shard', qty: 1 }] } },
  { id: 'tide-chart', kind: 'object', rarity: 'rare', regions: ['ruins'], chance: 0.1, unique: true, name: 'The Tide Chart', text: '{name} unrolled a faded chart showing tides and a coast that is on no other map.', when: { minLevel: 12 }, boost: { weather: { fog: 1.5 }, time: { night: 1.4 } }, reward: { items: [{ item: 'tide-chart', qty: 1 }], xp: 80 } },

  // ── Sunken Coast ──
  { id: 'pearl-bed', kind: 'resource', rarity: 'uncommon', regions: ['coast'], chance: 0.1, name: 'A bed of pearls', text: '{name} waded into the shallows and came back with pearls.', boost: { weather: { rain: 1.4 } }, reward: { items: [{ item: 'pearl', qty: 2 }] } },
  { id: 'tide-cave', kind: 'location', rarity: 'rare', regions: ['coast'], locations: ['sunken-cove'], chance: 0.05, unique: true, name: 'Tide Cave', text: 'The tide went far out, and a cave opened that {name} had never seen. The Tide Cave.', when: { time: ['morning', 'day'], minLevel: 17 } },
  { id: 'message-in-a-bottle', kind: 'quest', rarity: 'rare', regions: ['coast'], chance: 0.05, unique: true, name: 'A message in a bottle', text: '{name} found a bottle with a message inside. It asks for help.' },
  { id: 'storm-wreck', kind: 'treasure', rarity: 'rare', regions: ['coast'], chance: 0.1, name: 'A wreck, shaken loose', text: 'The storm shook a wreck loose from the sand, and {name} got there first.', when: { weather: ['storm'] }, reward: { gold: 450, items: [{ item: 'tide-crystal', qty: 1 }] } },

  // ── Dragon Peaks ──
  { id: 'ember-vein', kind: 'resource', rarity: 'uncommon', regions: ['peaks'], chance: 0.1, name: 'A warm seam in the rock', text: '{name} found a seam of rock that glowed from the inside.', boost: { weather: { snow: 1.5, storm: 1.4 } }, reward: { items: [{ item: 'ember-core', qty: 1 }] } },
  { id: 'dragon-nest', kind: 'location', rarity: 'rare', regions: ['peaks'], locations: ['ember-ridge'], chance: 0.04, unique: true, name: 'Dragon\u2019s Nest', text: 'A warm draft led {name} to a hollow lined with scales: the Dragon\u2019s Nest.', when: { time: ['day'], minLevel: 24 } },
  { id: 'frozen-shrine', kind: 'object', rarity: 'rare', regions: ['peaks'], chance: 0.06, unique: true, name: 'A frozen shrine', text: 'Through the snow, {name} found a shrine nobody had visited in a very long time.', when: { weather: ['snow', 'fog'] }, reward: { gold: 600, xp: 120 } },

  // ── Cosmic Rift ──
  { id: 'stardust-drift', kind: 'resource', rarity: 'uncommon', regions: ['rift'], chance: 0.12, name: 'A drift of stardust', text: 'Stardust collected in the corners like snow. {name} filled a pocket.', boost: { time: { night: 1.4 } }, reward: { items: [{ item: 'stardust', qty: 2 }] } },
  { id: 'fallen-star', kind: 'treasure', rarity: 'epic', regions: ['rift'], chance: 0.06, name: 'A fallen star', text: '{name} found a small star, still lit, resting in the grass of nowhere.', when: { time: ['night'] }, reward: { gold: 700, items: [{ item: 'meteor-shard', qty: 1 }] } },
  { id: 'rift-whisper', kind: 'object', rarity: 'epic', regions: ['rift'], chance: 0.05, name: 'A whisper from the rift', text: 'The Rift whispered something. {name} is still thinking about it.', reward: { items: [{ item: 'void-shard', qty: 1 }], xp: 200 } },
];

export const getDiscovery = (id: string) => DISCOVERIES.find((d) => d.id === id);

export const KIND_LABEL: Record<DiscoveryKind, string> = {
  location: 'Hidden place', treasure: 'Treasure', npc: 'New friend', resource: 'Rare resource', quest: 'Secret quest', object: 'Mysterious find',
};
