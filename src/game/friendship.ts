import type { Pet } from '@/types';
import { clamp } from '@/utils/format';
import { CARE_CONFIG as C } from './careConfig';

export const FRIENDSHIP_LEVELS = C.friendship.levels;

export function friendshipLevel(friendship: number): string {
  const value = Math.floor(friendship);
  let label: string = FRIENDSHIP_LEVELS[0].label;
  for (const level of FRIENDSHIP_LEVELS) if (value >= level.min) label = level.label;
  return label;
}

/** Next milestone (for "x to go" hints); null at max. */
export function nextFriendshipLevel(friendship: number) {
  return FRIENDSHIP_LEVELS.find((l) => l.min > Math.floor(friendship)) ?? null;
}

/** Local calendar day, e.g. "2026-09-30". */
export function localDay(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Friendship grows slowly: happier pets bond a bit faster, and there's a
 * daily cap so the maximum can't be reached in a sitting.
 */
export function addFriendship(pet: Pet, base: number, now: number, multiplier = 1): { pet: Pet; gained: number; levelUp: string | null } {
  const day = localDay(now);
  const today = pet.friendshipToday.day === day ? pet.friendshipToday : { day, gained: 0 };
  const [lo, hi] = C.friendship.happinessScale;
  const scaled = base * multiplier * (lo + (hi - lo) * (pet.happiness / 100));
  const gained = Math.max(0, Math.min(scaled, C.friendship.dailyCap - today.gained, 100 - pet.friendship));
  const friendship = clamp(pet.friendship + gained, 0, 100);
  const before = friendshipLevel(pet.friendship);
  const after = friendshipLevel(friendship);
  return {
    pet: { ...pet, friendship, friendshipToday: { day, gained: today.gained + gained } },
    gained,
    levelUp: after !== before ? after : null,
  };
}

// ── Experience ───────────────────────────────────────────────
export const xpToNext = (level: number) => Math.round(C.xp.base + C.xp.perLevel * Math.pow(level, C.xp.exponent));

export function addExperience(pet: Pet, xp: number): { pet: Pet; leveledUp: boolean } {
  let { level, experience } = pet;
  experience += xp;
  let leveledUp = false;
  while (level < C.xp.maxLevel && experience >= xpToNext(level)) {
    experience -= xpToNext(level);
    level += 1;
    leveledUp = true;
  }
  if (level >= C.xp.maxLevel) experience = 0;
  return { pet: { ...pet, level, experience }, leveledUp };
}
