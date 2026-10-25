import type { GameState, ItemStack, RegionId, Season, Weather, WorldTime } from '@/types';
import { createRng } from '@/utils/rng';
import { getItem } from '@/inventory/catalog';
import { addGold, addItems, spendGold } from '@/inventory/service';
import { grantExperience, type LevelUpInfo } from '@/progression/xp';
import { track } from '@/progression/track';
import { note } from '@/journal/journal';
import { worldAt } from './clock';
import { REGIONS, getRegion, regionStatus } from './regions';

const HOUR = 3_600_000;
export const EVENT_SLOT_MS = 4 * HOUR;
/** Chance that a given four-hour stretch has something happening. */
export const EVENT_CHANCE = 0.45;
export const EVENT_ENERGY = 5;

export type EventKind = 'merchant' | 'creature' | 'meteor' | 'flower' | 'map';

export interface WorldEventDef {
  id: string;
  kind: EventKind;
  name: string;
  /** Shown on the map card. */
  description: string;
  /** Button label. */
  action: string;
  weight: number;
  hours: number;
  when?: { time?: WorldTime[]; weather?: Weather[]; season?: Season[] };
  /** Preferred places (otherwise anywhere that's open). */
  regions?: RegionId[];
}

/** ADD AN EVENT: append here. Seasonal ones simply use `when.season`. */
export const EVENT_DEFS: WorldEventDef[] = [
  { id: 'traveling-merchant', kind: 'merchant', name: 'A traveling merchant arrives', description: 'A cart rattles in with a few things you won\u2019t find in the shop.', action: 'Browse wares', weight: 24, hours: 6, when: { time: ['morning', 'day', 'evening'] }, regions: ['village'] },
  { id: 'mysterious-creature', kind: 'creature', name: 'A mysterious creature appears', description: 'Something with lantern eyes is watching from the trees.', action: 'Approach', weight: 18, hours: 3, when: { time: ['night'], weather: ['fog', 'clear', 'rain'] } },
  { id: 'meteor-fall', kind: 'meteor', name: 'A meteor falls', description: 'A streak of light, a distant thump, and a smell like warm metal.', action: 'Search the crater', weight: 8, hours: 8, when: { time: ['night'], weather: ['clear', 'fog'] } },
  { id: 'rare-bloom', kind: 'flower', name: 'A rare flower blooms', description: 'A flower that only opens a few times a year is open right now.', action: 'Gather the bloom', weight: 14, hours: 6, when: { time: ['morning', 'day'], season: ['spring', 'summer', 'autumn'] } },
  { id: 'treasure-map', kind: 'map', name: 'A treasure map is discovered', description: 'Someone dropped a map. It has an X on it, and a coffee stain.', action: 'Follow the map', weight: 10, hours: 8 },
  // Seasonal
  { id: 'harvest-fair', kind: 'merchant', name: 'The Harvest Fair', description: 'Stalls of autumn food and good prices. Only here for a short while.', action: 'Visit the fair', weight: 18, hours: 8, when: { season: ['autumn'], time: ['morning', 'day', 'evening'] }, regions: ['village'] },
  { id: 'snow-spirit', kind: 'creature', name: 'A snow spirit drifts by', description: 'A little spirit made of drifting flakes is curious about your pet.', action: 'Say hello', weight: 16, hours: 4, when: { season: ['winter'], weather: ['snow', 'fog'] } },
  { id: 'firefly-night', kind: 'creature', name: 'The fireflies gather', description: 'Hundreds of tiny lights, all humming the same note.', action: 'Join them', weight: 16, hours: 3, when: { season: ['summer'], time: ['evening', 'night'] } },
  { id: 'blossom-day', kind: 'flower', name: 'Blossom Day', description: 'Every tree is flowering at once. It lasts about a day.', action: 'Gather blossoms', weight: 16, hours: 8, when: { season: ['spring'], time: ['morning', 'day'] } },
];

export const getEventDef = (id: string) => EVENT_DEFS.find((e) => e.id === id);

export interface WorldEventInstance {
  /** `ev-<slot>`: unique and stable. */
  id: string;
  type: string;
  region: RegionId;
  startsAt: number;
  endsAt: number;
}

function openRegionIds(state: GameState): RegionId[] {
  return REGIONS.filter((r) => regionStatus(state, r).open).map((r) => r.id);
}

function instanceForSlot(state: GameState, slot: number, open: RegionId[]): WorldEventInstance | null {
  const rng = createRng(`${state.world.seed}:event:${slot}`);
  if (!rng.fork('chance').chance(EVENT_CHANCE)) return null;
  const startsAt = slot * EVENT_SLOT_MS + rng.fork('start').int(0, 3 * HOUR);
  const now = worldAt(state.world, startsAt);
  const eligible = EVENT_DEFS.filter((d) => {
    const w = d.when;
    return !w || ((!w.time || w.time.includes(now.time)) && (!w.weather || w.weather.includes(now.weather)) && (!w.season || w.season.includes(now.season)));
  });
  if (eligible.length === 0) return null;
  const def = rng.fork('type').weighted(eligible, (d) => d.weight);
  const places = (def.regions ?? open).filter((r) => open.includes(r));
  if (places.length === 0) return null;
  return { id: `ev-${slot}`, type: def.id, region: rng.fork('region').pick(places), startsAt, endsAt: startsAt + def.hours * HOUR };
}

/**
 * What's happening in the world right now. Generated from the world seed and the clock, so it's the same for any
 * moment, with nothing stored and nothing running in the background.
 */
export function activeEvents(state: GameState, now: number): WorldEventInstance[] {
  if (!state.pet) return [];
  const open = openRegionIds(state);
  const last = Math.floor(now / EVENT_SLOT_MS);
  const first = last - Math.ceil(12 / 4); // events last at most 12 hours
  const out: WorldEventInstance[] = [];
  for (let slot = first; slot <= last; slot++) {
    const ev = instanceForSlot(state, slot, open);
    if (ev && ev.startsAt <= now && now < ev.endsAt && !state.world.eventsDone.includes(ev.id)) out.push(ev);
  }
  return out.sort((a, b) => a.endsAt - b.endsAt);
}

// ── Merchants ────────────────────────────────────────────────

const MERCHANT_POOLS: Record<string, { items: string[]; mult: number; count: number }> = {
  'traveling-merchant': { items: ['energy-tonic', 'luck-tonic', 'warrior-tonic', 'glow-ring', 'four-leaf-charm', 'forest-cloak', 'bear-tooth-charm', 'star-clip', 'moon-mushroom', 'glowstone'], mult: 1.15, count: 3 },
  'harvest-fair': { items: ['meat', 'fish', 'apple', 'berry', 'amber-leaf', 'healing-herb', 'energy-tonic', 'cozy-scarf'], mult: 0.8, count: 4 },
};

export interface MerchantWare { item: string; price: number; remaining: number }

export function merchantStock(state: GameState, ev: WorldEventInstance): MerchantWare[] {
  const pool = MERCHANT_POOLS[ev.type];
  if (!pool) return [];
  const level = state.pet?.level ?? 1;
  const items = pool.items.filter((i) => (getItem(i).metadata.levelRequired ?? 1) <= level);
  return createRng(`${state.world.seed}:${ev.id}:wares`).shuffle(items).slice(0, pool.count).map((item) => {
    const def = getItem(item);
    const stock = def.type === 'food' || def.type === 'material' ? 3 : 1;
    return {
      item,
      price: Math.max(1, Math.round((def.metadata.shopPrice ?? def.sellValue * 3.5) * pool.mult)),
      remaining: Math.max(0, stock - (state.world.eventPurchases[`${ev.id}:${item}`] ?? 0)),
    };
  });
}

export type BuyResult = { ok: true; state: GameState; message: string } | { ok: false; reason: string };

export function buyFromEvent(state: GameState, eventId: string, item: string, now: number): BuyResult {
  const ev = activeEvents(state, now).find((e) => e.id === eventId);
  const ware = ev && merchantStock(state, ev).find((w) => w.item === item);
  if (!ev || !ware) return { ok: false, reason: 'The merchant has moved on.' };
  if (ware.remaining < 1) return { ok: false, reason: 'Sold out.' };
  const paid = spendGold(state, ware.price);
  if (!paid) return { ok: false, reason: 'Not enough gold yet.' };
  const key = `${eventId}:${item}`;
  const next = addItems(paid, [{ item, qty: 1 }]);
  const withPurchase = { ...next, world: { ...next.world, eventPurchases: { ...next.world.eventPurchases, [key]: (next.world.eventPurchases[key] ?? 0) + 1 } } };
  return { ok: true, state: track(withPurchase, { purchases: 1, 'gold-spent': ware.price }, now), message: `Bought ${getItem(item).name}.` };
}

// ── Investigating ────────────────────────────────────────────

export interface EventReport {
  title: string;
  text: string;
  items: ItemStack[];
  gold: number;
  xp: number;
  levelUp: LevelUpInfo | null;
}

export type InvestigateResult = { ok: true; state: GameState; report: EventReport } | { ok: false; reason: string };

const SEASON_BLOOM: Record<Season, string> = { spring: 'spring-blossom', summer: 'sun-petal', autumn: 'amber-leaf', winter: 'frost-lily' };

/** Checks the pet out for an event. Deterministic: the same event always has the same outcome. */
export function investigateEvent(state: GameState, eventId: string, now: number): InvestigateResult {
  const ev = activeEvents(state, now).find((e) => e.id === eventId);
  const def = ev && getEventDef(ev.type);
  const pet = state.pet;
  if (!ev || !def || !pet) return { ok: false, reason: 'That has passed.' };
  if (def.kind === 'merchant') return { ok: false, reason: 'Browse the wares instead.' };
  if (state.adventure.active) return { ok: false, reason: `${pet.name} is out on an adventure.` };
  if (pet.sleep) return { ok: false, reason: `${pet.name} is asleep.` };
  if (pet.energy < EVENT_ENERGY) return { ok: false, reason: `${pet.name} is too tired.` };

  const rng = createRng(`${state.world.seed}:${ev.id}:outcome`);
  const season = worldAt(state.world, ev.startsAt).season;
  const n = pet.name;
  let items: ItemStack[] = [];
  let gold = 0, xp = 0, text = '', mapDiscovery = false;

  switch (def.kind) {
    case 'creature':
      items = [{ item: 'lantern-feather', qty: 1 }];
      xp = 25;
      if (rng.chance(0.25)) items.push({ item: 'moon-mushroom', qty: 1 });
      if (def.id === 'snow-spirit') items = [{ item: 'frost-lily', qty: 2 }];
      text = def.id === 'snow-spirit' ? `${n} and the snow spirit danced in the flurries. It left a few frost lilies behind.`
        : def.id === 'firefly-night' ? `${n} followed the fireflies in a long, slow circle. They left a feather glowing on the grass.`
        : `${n} approached slowly. The creature watched, blinked once, and was gone, leaving a feather behind.`;
      break;
    case 'meteor':
      items = [{ item: 'meteor-shard', qty: rng.chance(0.3) ? 2 : 1 }];
      gold = 80;
      xp = 60;
      text = `${n} found the crater still warm and carried home a shard of the sky.`;
      break;
    case 'flower':
      items = def.id === 'blossom-day' ? [{ item: 'spring-blossom', qty: 3 }] : [{ item: 'dawn-lily', qty: 1 }, { item: SEASON_BLOOM[season], qty: 1 }];
      xp = 20;
      text = `${n} found the bloom just in time and picked it very carefully.`;
      break;
    case 'map':
      mapDiscovery = !state.progress.flags.includes('disc:tide-chart');
      if (mapDiscovery) { items = [{ item: 'tide-chart', qty: 1 }]; xp = 50; text = `${n} followed the map and found an old tide chart. It shows a coast that is on no other map.`; }
      else { items = [{ item: rng.chance(0.5) ? 'relic-shard' : 'tide-crystal', qty: 1 }]; gold = 250; xp = 40; text = `${n} followed the map to a buried box. The X was real.`; }
      break;
  }

  let next: GameState = { ...state, pet: { ...pet, energy: pet.energy - EVENT_ENERGY } };
  next = addItems(addGold(next, gold), items);
  const res = grantExperience(next.pet!, xp);
  next = { ...next, pet: res.pet };
  if (mapDiscovery) next = { ...next, progress: { ...next.progress, flags: [...next.progress.flags, 'disc:tide-chart'] } };
  next = { ...next, world: { ...next.world, eventsDone: pruneDone([...next.world.eventsDone, ev.id], now) } };
  next = note(next, 'events', now, def.name, text);
  next = track(next, { events: 1, [`events:${def.kind}`]: 1, 'gold-earned': gold, levelups: res.levelUp ? res.levelUp.to - res.levelUp.from : 0, ...(mapDiscovery ? { discoveries: 1 } : {}) }, now);
  return { ok: true, state: next, report: { title: def.name, text, items, gold, xp, levelUp: res.levelUp } };
}

/** Keeps the "done" list short: ids carry their slot, so old ones can go. */
function pruneDone(ids: string[], now: number): string[] {
  const floor = Math.floor(now / EVENT_SLOT_MS) - 24;
  return ids.filter((id) => Number(id.slice(3)) >= floor);
}

export const eventRegionName = (ev: WorldEventInstance) => getRegion(ev.region)?.name ?? ev.region;
