import type {
  ActiveAdventure, AdventureRecord, AdventureResult, AdventureSnapshot, DurationId, GameState, LocationDefinition, Pet,
} from '@/types';
import { addFriendship } from '@/game/friendship';
import { addGold, addItems } from '@/inventory/service';
import { ITEMS, getItem } from '@/inventory/catalog';
import { grantExperience, type LevelUpInfo } from '@/progression/xp';
import { track } from '@/progression/track';
import { note } from '@/journal/journal';
import { seasonAt } from '@/world/clock';
import { applyDiscoveries, discoveryXp, planDiscoveries } from '@/world/apply';
import type { DiscoveryDefinition } from '@/world/discoveries';
import { getRegion, regionOpen } from '@/world/regions';
import { syncCare } from '@/game/simulation';
import { clamp } from '@/utils/format';
import { createRng } from '@/utils/rng';
import { ADVENTURE_CONFIG as A, getDuration } from './config';
import { affinityOf, combatStats, conditionOf } from './stats';
import { getLocation } from './locations';
import { resolveAdventure } from './resolve';

// ── Starting ─────────────────────────────────────────────────

export type StartBlock = 'no-pet' | 'busy' | 'asleep' | 'locked' | 'duration' | 'energy';

const REASONS: Record<StartBlock, string> = {
  'no-pet': 'There is no pet to send yet.',
  busy: 'Your pet is already out on an adventure, or has rewards waiting.',
  asleep: 'Your pet is asleep. Wake them first.',
  locked: 'That place isn\u2019t open to your pet yet.',
  duration: 'That trip length is not available here.',
  energy: 'Your pet is too tired for that long a trip.',
};
export const startBlockMessage = (b: StartBlock) => REASONS[b];

export function energyCostOf(durationId: DurationId): number {
  return getDuration(durationId).energy;
}

/** Why an adventure can't start right now, or null if it can. Used by both the UI and the rules. */
export function checkStart(pet: Pet | null, state: GameState, loc: LocationDefinition, durationId: DurationId): StartBlock | null {
  if (!pet) return 'no-pet';
  if (state.adventure.active || state.adventure.pending) return 'busy';
  if (pet.sleep) return 'asleep';
  if (pet.level < loc.minimumLevel || (loc.requiresFlag && !state.progress.flags.includes(loc.requiresFlag)) || !regionOpen(state, loc.region)) return 'locked';
  if (!loc.durationOptions.includes(durationId)) return 'duration';
  if (pet.energy < energyCostOf(durationId)) return 'energy';
  return null;
}

export function buildSnapshot(pet: Pet, loc: LocationDefinition): AdventureSnapshot {
  return { level: pet.level, stats: combatStats(pet), condition: conditionOf(pet).multiplier, affinity: affinityOf(pet, loc) };
}

export type StartResult = { ok: true; state: GameState } | { ok: false; reason: StartBlock; message: string };

/** Sends the pet away. `seed` is the only random input; it is stored so the result can be calculated later. */
export function startAdventure(
  state: GameState,
  request: { locationId: string; durationId: DurationId; seed: string },
  now: number,
): StartResult {
  const synced = syncCare(state, now);
  const loc = getLocation(request.locationId);
  const block = checkStart(synced.pet, synced, loc, request.durationId);
  if (block || !synced.pet) return { ok: false, reason: block ?? 'no-pet', message: REASONS[block ?? 'no-pet'] };

  const duration = getDuration(request.durationId);
  const active: ActiveAdventure = {
    id: `adv-${request.seed}`,
    locationId: loc.id,
    petId: synced.pet.id,
    durationId: duration.id,
    durationMs: duration.ms,
    startedAt: now,
    expectedCompletion: now + duration.ms,
    seed: request.seed,
    energyCost: duration.energy,
    snapshot: buildSnapshot(synced.pet, loc),
    world: { seed: synced.world.seed, season: seasonAt(now, synced.world.seasonMode), known: [...synced.progress.flags] },
  };
  return {
    ok: true,
    state: {
      ...synced,
      pet: { ...synced.pet, energy: clamp(synced.pet.energy - duration.energy, 0, 100), boosts: [] },
      adventure: { ...synced.adventure, active },
    },
  };
}

// ── Coming home ──────────────────────────────────────────────

/** If the pet is due back, works out what happened. Safe to call any time; returns the same object when nothing changed. */
export function syncAdventure(state: GameState, now: number): GameState {
  const { active } = state.adventure;
  if (!active || now < active.expectedCompletion) return state;
  return { ...state, adventure: { ...state.adventure, active: null, pending: resolveAdventure(active) } };
}

export type { LevelUpInfo };

export interface CollectReport {
  result: AdventureResult;
  levelUp: LevelUpInfo | null;
  friendshipLevelUp: string | null;
  /** Discoveries that counted (one-time finds already made are left out). */
  discoveries: DiscoveryDefinition[];
}

const RARE = new Set(['rare', 'epic', 'legendary', 'mythic']);

/** What the pet remembers about a trip: the trip itself, plus "first time" moments. */
function writeJournal(state: GameState, result: AdventureResult, found: DiscoveryDefinition[], now: number): GameState {
  const pet = state.pet!;
  const n = pet.name;
  const loc = getLocation(result.locationId);
  const region = getRegion(loc.region)?.name ?? loc.name;
  const hrs = result.durationMs / 3_600_000;
  const length = hrs >= 1 ? `${+hrs.toFixed(1)}h` : `${Math.round(hrs * 60)}m`;
  const sw = result.startWorld;
  const setting = sw ? ` It was ${sw.time === 'night' ? 'night' : sw.time}, and ${sw.weather === 'clear' ? 'the sky was clear' : sw.weather === 'fog' ? 'foggy' : sw.weather === 'storm' ? 'stormy' : sw.weather === 'snow' ? 'snowing' : 'raining'}.` : '';
  const verb = result.outcome === 'retreat' ? 'turned back early from' : 'explored';
  let s = note(state, 'adventures', now, loc.name, `${n} ${verb} ${loc.name} for ${length}: ${result.enemiesDefeated} enemies, ${result.xp} XP, ${result.gold} gold.${setting}`);

  s = note(s, 'milestones', now, 'First adventure', `${n} went on their first adventure, to ${loc.name}.`, 'first-adventure');
  s = note(s, 'memories', now, `First steps in ${region}`, `${n} set foot in ${region} for the first time.`, `first-visit:${loc.region}`);
  const rare = result.items.find((i) => RARE.has(getItem(i.item).rarity));
  if (rare) s = note(s, 'memories', now, 'First rare find', `${n} found their first rare item: ${getItem(rare.item).name}.`, 'first-rare');
  if (result.foundTreasure) s = note(s, 'memories', now, 'First treasure', `${n} found treasure for the first time.`, 'first-treasure');
  if (sw?.time === 'night') s = note(s, 'memories', now, 'After dark', `${n} explored at night for the first time. It was a little spooky, and a little wonderful.`, 'first-night');
  if (sw?.weather === 'rain' || sw?.weather === 'storm') s = note(s, 'memories', now, 'In the rain', `${n} set out in the rain for the first time and came back very wet and very happy.`, 'first-rain');
  if (result.outcome === 'retreat') s = note(s, 'memories', now, 'A hard day', `${n} had to turn back once. They were safe, and a little wiser.`, 'first-retreat');
  void found;
  return s;
}

/** Hands over the rewards: gold and materials into the inventory, XP (with level-ups), a happy pet, and a history entry. */
export function collectAdventure(state: GameState, now: number): { state: GameState; report: CollectReport | null } {
  const synced = syncAdventure(syncCare(state, now), now);
  const result = synced.adventure.pending;
  if (!result || !synced.pet) return { state: synced, report: null };

  const found = planDiscoveries(synced, result.discoveries ?? []);
  const xp = grantExperience(synced.pet, result.xp + discoveryXp(found));
  let pet: Pet = xp.pet;
  const levelUp = xp.levelUp;
  pet = { ...pet, happiness: clamp(pet.happiness + A.returnHappiness[result.outcome], 0, 100) };
  const bond = addFriendship(pet, A.returnFriendship, now);
  pet = bond.pet;

  const record: AdventureRecord = {
    id: result.id, locationId: result.locationId, startedAt: result.startedAt, completedAt: result.completedAt,
    durationId: result.durationId, outcome: result.outcome, enemies: result.enemiesDefeated, xp: result.xp, gold: result.gold,
    items: result.items, levelsGained: levelUp ? levelUp.to - levelUp.from : 0,
  };
  const adv = synced.adventure;
  // Rewards go through the InventoryService like everything else.
  let next: GameState = {
    ...synced,
    pet,
    adventure: { ...adv, pending: null, completed: adv.completed + 1, history: [record, ...adv.history].slice(0, A.historyLimit) },
  };
  next = addItems(addGold(next, result.gold), result.items);
  next = applyDiscoveries(next, found, now);
  next = writeJournal(next, result, found, now);

  const sw = result.startWorld;
  const counters: Record<string, number> = {
    adventures: 1,
    [`adventures:${result.locationId}`]: 1,
    [`adventures:${result.outcome}`]: 1,
    enemies: result.enemiesDefeated,
    treasures: result.foundTreasure ? 1 : 0,
    materials: result.items.filter((i) => ITEMS[i.item]?.type === 'material').reduce((n, i) => n + i.qty, 0),
    'gold-earned': result.gold,
    levelups: record.levelsGained,
    discoveries: found.length,
    ...(sw ? { [`adventures:time:${sw.time}`]: 1, [`adventures:weather:${sw.weather}`]: 1, [`adventures:season:${sw.season}`]: 1 } : {}),
  };
  for (const i of result.items) counters[`collected:${i.item}`] = (counters[`collected:${i.item}`] ?? 0) + i.qty;
  for (const [enemy, n] of Object.entries(result.enemyCounts)) counters[`defeated:${enemy}`] = n;
  for (const d of found) counters[`discoveries:${d.kind}`] = (counters[`discoveries:${d.kind}`] ?? 0) + 1;
  next = track(next, counters, now);
  return { state: next, report: { result, levelUp, friendshipLevelUp: bond.levelUp, discoveries: found } };
}

// ── Preview helpers ──────────────────────────────────────────

export type Outlook = 'comfortable' | 'uncertain' | 'risky';

/** Runs a handful of dry runs with the pet's current condition to judge how the trip would likely go. */
export function estimateOutlook(pet: Pet, loc: LocationDefinition, durationId: DurationId): { outlook: Outlook; clean: number } {
  const duration = getDuration(durationId);
  const snapshot = buildSnapshot(pet, loc);
  let clean = 0;
  for (let i = 0; i < A.previewRuns; i++) {
    const seed = createRng(`${pet.id}|${loc.id}|${durationId}|${i}`).seed;
    const r = resolveAdventure({
      id: `preview-${i}`, locationId: loc.id, petId: pet.id, durationId, durationMs: duration.ms,
      startedAt: 0, expectedCompletion: duration.ms, seed, energyCost: duration.energy, snapshot,
    });
    if (r.outcome !== 'retreat') clean++;
  }
  const share = clean / A.previewRuns;
  return { outlook: share >= 0.85 ? 'comfortable' : share >= 0.55 ? 'uncertain' : 'risky', clean: share };
}

export const returnedAfter = (result: AdventureResult, now: number) => Math.max(0, now - result.startedAt);
