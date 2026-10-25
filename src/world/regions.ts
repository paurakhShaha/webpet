import type { GameState, LocationDefinition, RegionId } from '@/types';
import { LOCATIONS } from '@/adventure/locations';

export interface Requirement {
  label: string;
  met: boolean;
  current?: number;
  target?: number;
}

export interface RegionDefinition {
  id: RegionId;
  name: string;
  description: string;
  /** Short flavour line for the map tooltip. */
  tagline: string;
  icon: string;
  /** Where the region sits on the map, in percent. */
  position: { x: number; y: number };
  /**
   * How to open it. Any mix of level, story/discovery flags and exploration counters.
   * `hint` words the flags vaguely, so discoveries stay a surprise.
   */
  unlock: {
    level?: number;
    flags?: { flag: string; hint: string }[];
    counters?: { metric: string; target: number; label: string }[];
  };
  /** Shown on the map as "?" until one of these is true. */
  revealedBy?: { counter?: { metric: string; target: number }; level?: number; flag?: string }[];
  /** Stories the region tells, shown on its page. */
  lore: string;
}

export const REGIONS: RegionDefinition[] = [
  {
    id: 'village', name: 'Village', icon: 'house', position: { x: 47, y: 54 },
    tagline: 'Home, and the people who make it feel like it.',
    description: 'A small, friendly village with a shop, a forge and a very busy potion cart. Everyone here knows your pet by name.',
    unlock: {},
    lore: 'Smoke rises from three chimneys. Someone is always baking.',
  },
  {
    id: 'forest', name: 'Whispering Forest', icon: 'tree-pine', position: { x: 19, y: 45 },
    tagline: 'Tall trees, soft voices, and plenty of places to hide a secret.',
    description: 'Old trees lean close and whisper. A gentle place to learn the ropes, and one that changes with the weather, the hour and the season.',
    unlock: {},
    lore: 'They say the forest remembers everyone who walks it.',
  },
  {
    id: 'mine', name: 'Crystal Mine', icon: 'pickaxe', position: { x: 36, y: 23 },
    tagline: 'Glittering tunnels, and goblins who guard them.',
    description: 'Echoing tunnels lined with glowing crystal. Goblins dig here, and not everything in the dark is a goblin.',
    unlock: { level: 5 },
    lore: 'The first miners sang while they worked. Some say the walls still sing back.',
  },
  {
    id: 'ruins', name: 'Ancient Ruins', icon: 'landmark', position: { x: 79, y: 50 },
    tagline: 'Older than any map. Still watched over.',
    description: 'Crumbled halls and silent statues. Something old is awake here, and it does not seem unfriendly.',
    unlock: { level: 12, flags: [{ flag: 'ruins-open', hint: 'Follow the story: the strange light beyond the forest' }] },
    lore: 'The stones are warm at night. Nobody knows why.',
  },
  {
    id: 'coast', name: 'Sunken Coast', icon: 'waves', position: { x: 40, y: 81 },
    tagline: 'A drowned harbour with its lanterns still lit.',
    description: 'A harbour that sank long ago, though the lanterns never went out. Storms are common, and so are pearls.',
    unlock: { level: 16, flags: [{ flag: 'disc:tide-chart', hint: 'A chart of the tides, somewhere in the old places' }] },
    lore: 'On calm nights you can hear a bell ringing under the water.',
  },
  {
    id: 'peaks', name: 'Dragon Peaks', icon: 'mountain', position: { x: 66, y: 20 },
    tagline: 'High, cold, and warmer than it should be.',
    description: 'Black rock, thin air and slow wings in the sky. The dragons here keep to themselves, mostly.',
    unlock: { level: 22, counters: [{ metric: 'adventures:sunken-cove', target: 3, label: 'Explore the Sunken Coast' }] },
    lore: 'The mountain is warm underfoot. The dragons say it is the mountain\u2019s way of saying hello.',
  },
  {
    id: 'rift', name: 'Cosmic Rift', icon: 'orbit', position: { x: 85, y: 8 },
    tagline: 'A seam in the sky where the stars come close.',
    description: 'Where the sky comes apart at the edges and the stars lean down to look. Few return with the same shadow they left with.',
    unlock: { level: 30, flags: [{ flag: 'rift-open', hint: 'Follow the story of the falling stars' }] },
    revealedBy: [{ counter: { metric: 'events:meteor', target: 1 } }, { level: 24 }, { flag: 'rift-open' }],
    lore: 'Time runs a little differently here. Bring snacks.',
  },
];

export const getRegion = (id: RegionId) => REGIONS.find((r) => r.id === id);
export const locationsOf = (id: RegionId): LocationDefinition[] => LOCATIONS.filter((l) => l.region === id);

const counter = (s: GameState, m: string) => s.progress.counters[m] ?? 0;
const levelOf = (s: GameState) => s.pet?.level ?? 1;

export function regionRequirements(state: GameState, r: RegionDefinition): Requirement[] {
  const out: Requirement[] = [];
  const { level, flags, counters } = r.unlock;
  if (level) out.push({ label: `Reach level ${level}`, met: levelOf(state) >= level, current: levelOf(state), target: level });
  for (const f of flags ?? []) out.push({ label: f.hint, met: state.progress.flags.includes(f.flag) });
  for (const c of counters ?? []) out.push({ label: c.label, met: counter(state, c.metric) >= c.target, current: Math.min(counter(state, c.metric), c.target), target: c.target });
  return out;
}

export interface RegionStatus {
  /** Visible on the map (otherwise it's a "?"). */
  revealed: boolean;
  open: boolean;
  requirements: Requirement[];
  /** 0–1: how close the requirements are to being met. */
  progress: number;
}

export function regionStatus(state: GameState, r: RegionDefinition): RegionStatus {
  const requirements = regionRequirements(state, r);
  const open = requirements.every((q) => q.met);
  const revealed =
    open || !r.revealedBy ||
    r.revealedBy.some((c) =>
      (c.counter && counter(state, c.counter.metric) >= c.counter.target) || (c.level && levelOf(state) >= c.level) || (c.flag && state.progress.flags.includes(c.flag)));
  const parts = requirements.map((q) => (q.met ? 1 : q.target ? (q.current ?? 0) / q.target : 0));
  return { revealed, open, requirements, progress: parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 1 };
}

export const regionOpen = (state: GameState, id: RegionId) => {
  const r = getRegion(id);
  return !!r && regionStatus(state, r).open;
};

/** A place is visible once its region is open and, if hidden, once it has been discovered. */
export const locationVisible = (state: GameState, loc: LocationDefinition) =>
  !loc.hidden || (!!loc.requiresFlag && state.progress.flags.includes(loc.requiresFlag));

export const RANKS = [
  { min: 0, label: 'Newcomer' },
  { min: 3, label: 'Familiar' },
  { min: 8, label: 'Explorer' },
  { min: 15, label: 'Expert' },
  { min: 30, label: 'Master' },
] as const;

/** How well the pet knows a region, from the number of adventures done there. */
export function regionRank(state: GameState, id: RegionId) {
  const trips = locationsOf(id).reduce((n, l) => n + counter(state, `adventures:${l.id}`), 0);
  let idx = 0;
  RANKS.forEach((r, i) => { if (trips >= r.min) idx = i; });
  const next = RANKS[idx + 1];
  return { trips, rank: RANKS[idx].label, next: next ? { label: next.label, at: next.min } : null, progress: next ? (trips - RANKS[idx].min) / (next.min - RANKS[idx].min) : 1 };
}
