import type { GameState, NpcId, RegionId, Season, Weather, WorldNow, WorldTime } from '@/types';
import { createRng } from '@/utils/rng';
import type { ShopSection } from '@/shop/listings';

export type NpcLineKind = 'greet' | 'idle' | 'hint' | 'bought' | 'broke' | 'sold' | 'soldOut' | 'basket' | 'basketGone';

export interface NpcLine {
  kind: NpcLineKind;
  text: string;
  when?: { time?: WorldTime[]; weather?: Weather[]; season?: Season[]; minLevel?: number; flag?: string };
}

export interface NpcDefinition {
  id: NpcId;
  name: string;
  role: string;
  blurb: string;
  home: RegionId;
  /** Flag a discovery sets when you find them. Otherwise they're always around. */
  foundBy?: string;
  /** Only around in this kind of world (the Mystery Traveler prefers night and fog). */
  presence?: { time?: WorldTime[]; weather?: Weather[] };
  /** Which shop shelves they run. */
  sells?: ShopSection[];
  /** Quests they offer once you've met them (also gated by those quests' own rules). */
  quests?: string[];
  lines: NpcLine[];
}

const l = (kind: NpcLineKind, text: string, when?: NpcLine['when']): NpcLine => ({ kind, text, when });

/** ADD AN NPC: append here, give them a portrait in pixel/npcs.ts, and (optionally) shelves or quests. */
export const NPCS: NpcDefinition[] = [
  {
    id: 'village-merchant', name: 'Mossy', role: 'Village Merchant', home: 'village',
    blurb: 'Sells food, goods and a few pretty things. Knows everyone, and everyone\u2019s favourite snack.',
    sells: ['food', 'materials', 'cosmetics'], quests: ['npc-merchant-1'],
    lines: [
      l('greet', 'Welcome in! Take your time.'), l('greet', 'Ah, a friend! Have a look around.'),
      l('greet', 'Good morning! The bread is still warm.', { time: ['morning'] }),
      l('greet', 'Shutting up soon, but I always have time for you.', { time: ['evening', 'night'] }),
      l('greet', 'Rainy day! Perfect weather for browsing.', { weather: ['rain'] }),
      l('idle', 'The forest looks different after rain. You should see it.'), l('idle', 'Business is good. Business is always good when it is you.'),
      l('hint', 'If you need gold, try the Whispering Forest. Gentle, and generous.'),
      l('hint', 'Fog makes odd things easier to find. Or so the old stories say.', { weather: ['fog'] }),
      l('hint', 'Winter wares come in this week. Mind the frost lilies!', { season: ['winter'] }),
      l('bought', 'Lovely choice!'), l('bought', 'It\u2019ll serve you well.'), l('bought', 'Thank you kindly!'),
      l('broke', 'A bit short on gold? Adventures pay well.'), l('broke', 'Come back when your purse is heavier.'),
      l('soldOut', 'All gone for now. I restock regularly.'), l('sold', 'Fair price. Pleasure doing business.'),
      l('basket', 'A little something for the road.'), l('basketGone', 'You\u2019ve had today\u2019s basket. Come back tomorrow!'),
    ],
  },
  {
    id: 'blacksmith', name: 'Brannoch', role: 'Blacksmith', home: 'village',
    blurb: 'Honest metal for honest adventures. Talks mostly to the anvil.',
    sells: ['equipment'], quests: ['npc-smith-1'],
    lines: [
      l('greet', 'Mm. Come in. Mind the sparks.'), l('greet', 'Early start. Good. Iron likes an early start.', { time: ['morning'] }),
      l('greet', 'Storm outside. Forge is the warmest place in the village.', { weather: ['storm'] }),
      l('idle', 'A good blade is mostly patience.'), l('idle', 'Don\u2019t tell the potion maker, but I like her stew.'),
      l('hint', 'Better steel waits for stronger hands. Level up and I\u2019ll have more to show you.'),
      l('hint', 'Iron from the mine. Bring me ten ore and I\u2019ll make it worth your while.', { flag: 'met:blacksmith' }),
      l('bought', 'Mm. Good. Look after it.'), l('bought', 'It\u2019ll hold. I made sure.'),
      l('broke', 'Not enough gold. Honest work costs honest coin.'), l('soldOut', 'Sold out. More when the forge cools.'),
      l('sold', 'Decent. I can use that.'),
    ],
  },
  {
    id: 'potion-maker', name: 'Thistle', role: 'Potion Maker', home: 'village',
    blurb: 'Tonics for every occasion. Hums while she stirs, which is how you know it\u2019s working.',
    sells: ['tonics'], quests: ['npc-potion-1'],
    lines: [
      l('greet', 'Oh! Mind the bubbling one. It\u2019s shy.'), l('greet', 'Rain! The herbs love it. So do I.', { weather: ['rain'] }),
      l('greet', 'Moon\u2019s up. The best brews are made now.', { time: ['night'] }),
      l('idle', 'Eight stirs clockwise, one counter. Always.'), l('idle', 'Healing herb goes in last. Always last.'),
      l('hint', 'A little luck before a long trip never hurt anyone.'), l('hint', 'Rainbloom only opens in rain. If you find some, I\u2019ll be very grateful.', { weather: ['rain'] }),
      l('bought', 'Take it before the next trip, not during!'), l('bought', 'Careful, it\u2019s potent.'),
      l('broke', 'Oh dear, not enough gold. I\u2019d give it away, but the cauldron has bills.'), l('soldOut', 'All out for now. Another batch soon!'),
    ],
  },
  {
    id: 'old-explorer', name: 'Old Wren', role: 'Old Explorer', home: 'village', foundBy: 'disc:old-explorer-camp',
    blurb: 'Has been everywhere twice and forgot where once. Loves a good map.',
    quests: ['npc-explorer-1'],
    lines: [
      l('greet', 'Ha! The little one who found my camp. Come, sit.'), l('greet', 'Morning! Best hour for walking, and for talking about walking.', { time: ['morning'] }),
      l('idle', 'Never trust a map that looks too tidy.'), l('idle', 'I once followed a river all the way back to where I started.'),
      l('hint', 'The forest hides more after dark. Moths know the way, if you follow them.', { flag: 'disc:old-explorer-camp' }),
      l('hint', 'Ruins like fog. The things in them like it more.', { weather: ['fog'] }),
      l('hint', 'Coast? Aye, there is one. Old charts mention tides. Look where the stones are oldest.'),
      l('hint', 'Meteors fall at night. If you see one, go. Don\u2019t wait.', { time: ['night'] }),
      l('hint', 'Winter is quiet. The best time to notice things.', { season: ['winter'] }),
    ],
  },
  {
    id: 'mystery-traveler', name: 'The Traveler', role: 'Mystery Traveler', home: 'village', foundBy: 'disc:mystery-traveler',
    presence: { time: ['night', 'evening'], weather: ['fog'] },
    blurb: 'Shows up at dusk or in the fog, always with something unusual. Never says where they came from.',
    sells: ['traveler'], quests: ['npc-traveler-1'],
    lines: [
      l('greet', 'Ah. There you are. I thought you might come.'), l('greet', 'The fog brings strange customers. You\u2019re the nicest one.', { weather: ['fog'] }),
      l('greet', 'Night is when the best things surface.', { time: ['night'] }),
      l('idle', 'I\u2019ve walked a lot of paths. Yours is an interesting one.'), l('idle', 'No, I don\u2019t know what\u2019s in the rift. Yet.'),
      l('hint', 'A coast under the waves, a chart in the stones. Funny how things connect.'), l('hint', 'Stars fall on clear nights. Collect them, if you can.', { time: ['night'] }),
      l('bought', 'A fine choice. It chose you, really.'), l('broke', 'Not enough gold. Come back with more. I\u2019ll still be around. Probably.'),
      l('soldOut', 'That\u2019s all I carry. Today.'),
    ],
  },
];

export const getNpc = (id: NpcId) => NPCS.find((n) => n.id === id);

/** Is this NPC around right now? They must have been found, and be there at this time and in this weather. */
export function npcPresent(state: GameState, npc: NpcDefinition, now: WorldNow): boolean {
  if (npc.foundBy && !state.progress.flags.includes(npc.foundBy)) return false;
  if (!npc.presence) return true;
  const { time, weather } = npc.presence;
  return (!!time && time.includes(now.time)) || (!!weather && weather.includes(now.weather));
}

export const npcsInRegion = (state: GameState, region: RegionId, now: WorldNow) => NPCS.filter((n) => n.home === region && npcPresent(state, n, now));
export const hasMet = (state: GameState, id: NpcId) => state.progress.flags.includes(`met:${id}`);

/** Picks a line, preferring ones that fit the moment (time, weather, season, level). */
export function npcSays(npc: NpcDefinition, kind: NpcLineKind, ctx: { world: WorldNow; level: number; flags: string[] }, seed: string): string {
  const pool = npc.lines.filter((x) => x.kind === kind).map((x) => {
    const w = x.when;
    if (!w) return { x, score: 0 };
    const ok = (!w.time || w.time.includes(ctx.world.time)) && (!w.weather || w.weather.includes(ctx.world.weather)) &&
      (!w.season || w.season.includes(ctx.world.season)) && (!w.minLevel || ctx.level >= w.minLevel) && (!w.flag || ctx.flags.includes(w.flag));
    return { x, score: ok ? Object.keys(w).length : -1 };
  }).filter((c) => c.score >= 0);
  if (pool.length === 0) return '';
  const rng = createRng(`${npc.id}:${kind}:${seed}`);
  return rng.weighted(pool, (c) => 1 + c.score * 2).x.text;
}
