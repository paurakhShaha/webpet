import type { GameState, Pet, Settings } from '@/types';
import { createInitialState, migrateState } from '@/game/state';
import { uuid } from '@/utils/id';

// The only module that touches chrome.storage. Everything else goes through these functions.

const GAME_KEY = 'webpet:game';
const SETTINGS_KEY = 'webpet:settings';
const BACKUP_KEY = 'webpet:game:unreadable-backup';
const LOCK_NAME = 'webpet:game-lock';

interface StorageAdapter {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  onChange(key: string, cb: (value: unknown) => void): () => void;
}

const chromeAdapter: StorageAdapter = {
  async get(key) {
    return (await chrome.storage.local.get(key))[key];
  },
  async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
  },
  onChange(key, cb) {
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[key]) cb(changes[key].newValue);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  },
};

/** Used only when running the UI outside an extension (`npm run dev`). */
const webAdapter: StorageAdapter = {
  async get(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  },
  async set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  onChange(key, cb) {
    const listener = (e: StorageEvent) => {
      if (e.key === key) cb(e.newValue ? JSON.parse(e.newValue) : undefined);
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  },
};

const adapter: StorageAdapter =
  typeof chrome !== 'undefined' && chrome.storage?.local ? chromeAdapter : webAdapter;

/**
 * Serialises read-modify-write across the popup, side panel and service worker,
 * so two contexts opening at once can never lay two eggs.
 */
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = globalThis.navigator?.locks;
  return locks ? locks.request(LOCK_NAME, fn) : fn();
}

// ── Unlocked internals ───────────────────────────────────────

async function readState(): Promise<GameState | null> {
  const raw = await adapter.get(GAME_KEY);
  if (raw === undefined || raw === null) return null;
  const state = migrateState(raw);
  if (!state) await adapter.set(BACKUP_KEY, raw); // keep unreadable data instead of silently losing it
  return state;
}

async function writeState(state: GameState): Promise<GameState> {
  const stamped = { ...state, updatedAt: Date.now() };
  await adapter.set(GAME_KEY, stamped);
  return stamped;
}

function freshState(): GameState {
  return createInitialState({ eggId: uuid(), seed: uuid(), now: Date.now() });
}

// ── Public API ───────────────────────────────────────────────

/** Reads the saved game, or null if none exists yet. */
export const loadGame = (): Promise<GameState | null> => readState();

/** Writes a full game state. Prefer `updateGame` for changes. */
export const saveGame = (state: GameState): Promise<GameState> => withLock(() => writeState(state));

/**
 * Starts a new game with exactly one egg. If a game already exists it is
 * returned untouched, unless `overwrite` is set (dev/reset only).
 */
export function createNewGame(options: { overwrite?: boolean } = {}): Promise<GameState> {
  return withLock(async () => {
    if (!options.overwrite) {
      const existing = await readState();
      if (existing) return existing;
    }
    return writeState(freshState());
  });
}

/** Load the game, creating it on first run. Safe to call from anywhere, any number of times. */
export const ensureGame = (): Promise<GameState> => createNewGame();

/** Atomic read → change → write. Return the same object to skip the write. */
export function updateGame(updater: (state: GameState) => GameState): Promise<GameState> {
  return withLock(async () => {
    const existing = await readState();
    const current = existing ?? freshState();
    const next = updater(current);
    if (existing && next === existing) return existing;
    return writeState(next);
  });
}

/** Re-saves the current game so any pending upgrade (see MIGRATIONS) is written to disk. */
export const touchGame = (): Promise<GameState> => updateGame((state) => ({ ...state }));

/** Patch the pet, either with a partial object or an updater function. */
export function updatePet(patch: Partial<Pet> | ((pet: Pet) => Pet)): Promise<GameState> {
  return updateGame((state) => {
    if (!state.pet) return state;
    const pet = typeof patch === 'function' ? patch(state.pet) : { ...state.pet, ...patch };
    return { ...state, pet };
  });
}

/** Notified when another context (popup ↔ side panel) changes the save. */
export function subscribeToGame(cb: (state: GameState) => void): () => void {
  return adapter.onChange(GAME_KEY, (value) => {
    const state = migrateState(value);
    if (state) cb(state);
  });
}

// ── Settings (theme etc.), stored separately from the game save ─────────

export const DEFAULT_SETTINGS: Settings = { theme: 'system', roam: true, chatter: true, notifications: true };

const readSettings = async (): Promise<Settings> => ({
  ...DEFAULT_SETTINGS,
  ...((await adapter.get(SETTINGS_KEY)) as Partial<Settings> | undefined),
});

export const loadSettings = (): Promise<Settings> => readSettings();

export function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return withLock(async () => {
    const next = { ...(await readSettings()), ...patch };
    await adapter.set(SETTINGS_KEY, next);
    return next;
  });
}

export function subscribeToSettings(cb: (settings: Settings) => void): () => void {
  return adapter.onChange(SETTINGS_KEY, (value) => cb({ ...DEFAULT_SETTINGS, ...(value as Partial<Settings>) }));
}
