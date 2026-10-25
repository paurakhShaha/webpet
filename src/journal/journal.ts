import type { GameState, JournalEntry, JournalSection } from '@/types';
import { ACHIEVEMENTS } from '@/achievements';
import { FRIENDSHIP_LEVELS } from '@/game/friendship';
import { REGIONS, regionStatus } from '@/world/regions';

export const JOURNAL_LIMIT = 400;
const LEVEL_MARKS = [2, 5, 10, 15, 20, 25, 30, 40, 50];

export const hasKey = (state: GameState, key: string) => state.journal.keys.includes(key);

/** Adds an entry. Oldest adventure notes go first if the journal is ever full; milestones and memories are kept. */
export function addEntry(state: GameState, entry: Omit<JournalEntry, 'id'>, key?: string): GameState {
  if (key && hasKey(state, key)) return state;
  const id = `j${entry.at.toString(36)}${state.journal.entries.length.toString(36)}`;
  let entries = [...state.journal.entries, { ...entry, id }];
  if (entries.length > JOURNAL_LIMIT) {
    const drop = entries.findIndex((e) => e.section === 'adventures');
    entries = drop >= 0 ? entries.filter((_, i) => i !== drop) : entries.slice(1);
  }
  return { ...state, journal: { entries, keys: key ? [...state.journal.keys, key] : state.journal.keys } };
}

/** Quietly marks something as "already written" so it's never backfilled. */
export const markKeys = (state: GameState, keys: string[]): GameState => {
  const fresh = keys.filter((k) => !hasKey(state, k));
  return fresh.length ? { ...state, journal: { ...state.journal, keys: [...state.journal.keys, ...fresh] } } : state;
};

export const note = (state: GameState, section: JournalSection, at: number, title: string, text: string, key?: string) =>
  addEntry(state, { at, section, title, text }, key);

/**
 * Writes the pet's milestones from the state itself: hatching, levels, friendship, achievements, new regions.
 * Idempotent (each is written once), so it can run after every event.
 */
export function recordMilestones(state: GameState, now: number): GameState {
  const pet = state.pet;
  if (!pet?.originalName) return state;
  let s = state;
  const n = pet.name;

  s = note(s, 'milestones', pet.createdAt, 'Hatched', `${n} hatched from a mysterious egg.`, 'hatched');
  for (const mark of LEVEL_MARKS) {
    if (pet.level >= mark) s = note(s, 'milestones', now, `Level ${mark}`, mark === 2 ? `${n} grew a little. First level up!` : `${n} reached level ${mark}.`, `level:${mark}`);
  }
  for (const f of FRIENDSHIP_LEVELS.slice(1)) {
    if (Math.floor(pet.friendship) >= f.min) s = note(s, 'milestones', now, f.label, `${n} now sees you as ${/^[AEIOU]/.test(f.label) ? 'an' : 'a'} ${f.label}.`, `friend:${f.label}`);
  }
  for (const a of ACHIEVEMENTS) {
    const at = s.progress.achievements[a.id];
    if (at) s = note(s, 'milestones', at, a.name, `Achievement: ${a.description}`, `achv:${a.id}`);
  }
  for (const r of REGIONS) {
    if (r.id === 'village' || r.id === 'forest') continue;
    if (regionStatus(s, r).open) s = note(s, 'events', now, `${r.name} opens`, `A new place opens up: the ${r.name}.`, `region:${r.id}`);
  }
  return s;
}

/** "September 29", with the year if it isn't this year. */
export function formatJournalDate(at: number, now = Date.now()): string {
  const d = new Date(at);
  const base = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' }).format(d);
  return d.getFullYear() === new Date(now).getFullYear() ? base : `${base}, ${d.getFullYear()}`;
}

export const SECTION_LABEL: Record<JournalSection, string> = {
  memories: 'Memories', discoveries: 'Discoveries', adventures: 'Adventures', events: 'Important Events', milestones: 'Pet Milestones',
};
