import type { GameState } from '@/types';
import { createEgg } from '@/egg/createEgg';
import { emptyAdventureState } from '@/adventure/defaults';
import { emptyEquipment } from '@/inventory/equipment';
import { emptyJournal, emptyWorld } from '@/world/defaults';
import { ACHIEVEMENTS } from '@/achievements';
import { STARTER_ITEMS, emptyInventory, emptyProgress, emptyQuests, emptyShop } from '@/progression/defaults';
import { SAVE_VERSION } from './config';

export function createInitialState(params: { eggId: string; seed: string; now: number }): GameState {
  const { eggId, seed, now } = params;
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    phase: 'welcome',
    egg: createEgg({ id: eggId, seed, now }),
    pet: null,
    awaySummary: null,
    adventure: emptyAdventureState(),
    inventory: emptyInventory(),
    shop: emptyShop(),
    quests: emptyQuests(),
    progress: emptyProgress(),
    world: emptyWorld(seed),
    journal: emptyJournal(),
  };
}

/** Upgrade steps keyed by the version they upgrade FROM. */
const MIGRATIONS: Record<number, (state: GameState) => GameState> = {
  // v1 → v2: hunger flips meaning (was 0 = full, now 100 = satisfied) and pets gain care bookkeeping.
  1: (state) => ({
    ...state,
    awaySummary: null,
    pet: state.pet && {
      ...state.pet,
      hunger: Math.min(100, Math.max(0, 100 - state.pet.hunger)),
      careUpdatedAt: Date.now(),
      sleep: null,
      lastActionAt: {},
      friendshipToday: { day: '', gained: 0 },
    },
  }),
  // v2 → v3: adventures. Nothing else changes.
  2: (state) => ({ ...state, adventure: emptyAdventureState() }),
  // v3 → v4: inventory, shop, quests, achievements. Gold and materials move from `adventure` into `inventory`;
  // food is now an item, so everyone gets a starter supply (it used to be unlimited).
  3: (state) => {
    const old = state.adventure as unknown as { gold?: number; items?: Record<string, number>; completed: number; history: { locationId: string; enemies: number }[] };
    const items: Record<string, number> = { ...STARTER_ITEMS };
    for (const [id, n] of Object.entries(old.items ?? {})) items[id] = (items[id] ?? 0) + n;
    const history = old.history ?? [];
    const counters: Record<string, number> = { adventures: old.completed ?? history.length, enemies: history.reduce((n, r) => n + r.enemies, 0) };
    for (const r of history) counters[`adventures:${r.locationId}`] = (counters[`adventures:${r.locationId}`] ?? 0) + 1;
    if (state.pet) counters.levelups = state.pet.level - 1;
    const { gold: _g, items: _i, ...adventure } = old as Record<string, unknown>;
    return {
      ...state,
      adventure: adventure as unknown as GameState['adventure'],
      pet: state.pet && { ...state.pet, equipment: emptyEquipment(), cosmetic: null, boosts: [] },
      inventory: { gold: old.gold ?? 0, items },
      shop: emptyShop(),
      quests: emptyQuests(),
      // Pets that already reached the ruins' level don't have to replay the story to keep going.
      progress: { ...emptyProgress(), counters, flags: state.pet && state.pet.level >= 12 ? ['ruins-open'] : [] },
    };
  },
  // v4 → v5: the living world. Adds the world seed and a journal, and seeds the journal from what's already happened
  // (hatching, past adventures, achievements) so nothing is lost. Levels, friendship and regions are marked as
  // "already known" instead of being written up all at once.
  4: (state) => {
    const pet = state.pet;
    const journal: GameState['journal'] = { entries: [], keys: [] };
    const add = (at: number, section: GameState['journal']['entries'][number]['section'], title: string, text: string, key?: string) => {
      journal.entries.push({ id: `m${journal.entries.length.toString(36)}`, at, section, title, text });
      if (key) journal.keys.push(key);
    };
    if (pet?.originalName) {
      add(pet.createdAt, 'milestones', 'Hatched', `${pet.name} hatched from a mysterious egg.`, 'hatched');
      for (const r of state.adventure.history ?? []) {
        add(r.completedAt, 'adventures', 'Adventure', `${pet.name} went exploring and came home with ${r.xp} XP and ${r.gold} gold.`);
      }
      for (const a of ACHIEVEMENTS) {
        const at = state.progress.achievements[a.id];
        if (at) add(at, 'milestones', a.name, `Achievement: ${a.description}`, `achv:${a.id}`);
      }
      for (const mark of [2, 5, 10, 15, 20, 25, 30, 40, 50]) if (pet.level >= mark) journal.keys.push(`level:${mark}`);
      for (const f of ['Acquaintance', 'Friend', 'Close Friend', 'Best Friend', 'Soul Companion']) journal.keys.push(`friend:${f}`);
      for (const r of ['mine', 'ruins']) journal.keys.push(`region:${r}`);
    }
    journal.entries.sort((a, b) => a.at - b.at);
    return { ...state, world: emptyWorld(state.egg.seed), journal };
  },
};

/** Validates and upgrades whatever was in storage. Returns null if unusable. */
export function migrateState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  let state = raw as GameState;
  if (typeof state.version !== 'number' || !state.egg || !state.phase) return null;
  while (state.version < SAVE_VERSION) {
    const step = MIGRATIONS[state.version];
    if (!step) return null;
    state = { ...step(state), version: state.version + 1 };
  }
  return state;
}
