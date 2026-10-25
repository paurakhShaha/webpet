import type { FoodId, GameState, Pet, PetAnimation, ReactionId } from '@/types';
import { clamp } from '@/utils/format';
import { isPetAway } from '@/adventure/defaults';
import { getQuantity, removeItems } from '@/inventory/service';
import { track } from '@/progression/track';
import { CARE_CONFIG as C, PERSONALITY_CARE } from './careConfig';
import { FOODS, favoriteFood } from './foods';
import { addExperience, addFriendship } from './friendship';
import { getMood } from './mood';
import { chooseReaction, reactionNarration, REACTIONS } from './reactions';
import { syncCare } from './simulation';
import { say } from './talk';

export type CareRequest =
  | { type: 'pet' }
  | { type: 'feed'; food: FoodId }
  | { type: 'play' }
  | { type: 'groom' }
  | { type: 'sleep' }
  | { type: 'wake' };

/** What the player sees happen. Plain data, so it can cross from the background worker to a page. */
export interface Interaction {
  type: CareRequest['type'];
  /** False when the pet declined (too full, too tired…). */
  ok: boolean;
  dialogue: string;
  narration?: string;
  notice?: string;
  animation: PetAnimation;
  reaction?: ReactionId;
  food?: FoodId;
}

export interface CareOutcome {
  state: GameState;
  interaction: Interaction | null;
}

// ── Cooldowns ────────────────────────────────────────────────

export function cooldownMs(key: string): number {
  if (key === 'pet') return C.actions.pet.cooldownMs;
  if (key === 'play') return C.actions.play.cooldownMs;
  if (key === 'groom') return C.actions.groom.cooldownMs;
  if (key.startsWith('feed:')) return FOODS[key.slice(5)]?.cooldownMs ?? 0;
  return 0;
}

export function cooldownRemaining(pet: Pet, key: string, now: number): number {
  const last = pet.lastActionAt[key];
  return last === undefined ? 0 : Math.max(0, last + cooldownMs(key) - now);
}

// ── Rewards ──────────────────────────────────────────────────

interface Reward {
  happiness?: number;
  hunger?: number;
  energy?: number;
  friendship?: number;
  friendshipMultiplier?: number;
  xp?: number;
}

function applyReward(pet: Pet, r: Reward, now: number, rnd: () => number): { pet: Pet; notices: string[] } {
  let next: Pet = {
    ...pet,
    happiness: clamp(pet.happiness + (r.happiness ?? 0), 0, 100),
    hunger: clamp(pet.hunger + (r.hunger ?? 0), 0, 100),
    energy: clamp(pet.energy + (r.energy ?? 0), 0, 100),
  };
  const notices: string[] = [];
  if (r.friendship) {
    const res = addFriendship(next, r.friendship, now, r.friendshipMultiplier);
    next = res.pet;
    if (res.levelUp) notices.push(say('friendship-up', next, now, rnd, { vars: { label: res.levelUp } }));
  }
  if (r.xp) {
    const res = addExperience(next, r.xp);
    next = res.pet;
    if (res.leveledUp) notices.push(say('levelup', next, now, rnd, { vars: { level: String(next.level) } }));
  }
  return { pet: next, notices };
}

// ── The main entry point ─────────────────────────────────────

/**
 * Pure: applies one care request to the game and describes what happened.
 * Always brings the pet up to date first, so offline time is accounted for.
 */
export function applyCare(state: GameState, request: CareRequest, now: number, rnd: () => number = Math.random): CareOutcome {
  const synced = syncCare(state, now);
  const current = synced.pet;
  if (synced.phase !== 'pet' || !current || isPetAway(synced, now)) return { state: synced, interaction: null };

  const mods = PERSONALITY_CARE[current.personality];
  const withPet = (pet: Pet): GameState => ({ ...synced, pet });
  const refuse = (pet: Pet, type: CareRequest['type'], dialogue: string, animation: PetAnimation = 'idle'): CareOutcome => ({
    state: withPet(pet),
    interaction: { type, ok: false, dialogue, animation },
  });
  const cooling = (key: string) => cooldownRemaining(current, key, now) > 0;
  const stamp = (pet: Pet, key: string): Pet => ({ ...pet, lastActionAt: { ...pet.lastActionAt, [key]: now } });

  switch (request.type) {
    case 'pet': {
      if (current.sleep) {
        return { state: synced, interaction: { type: 'pet', ok: true, dialogue: say('sleeping-touched', current, now, rnd), animation: 'sleep' } };
      }
      const reaction = chooseReaction(current, rnd);
      let pet = current;
      let notices: string[] = [];
      if (!cooling('pet')) {
        const shy = reaction === 'shy' ? 0.6 : 1;
        ({ pet, notices } = applyReward(stamp(current, 'pet'), {
          happiness: C.actions.pet.happiness * shy, friendship: C.actions.pet.friendship,
          friendshipMultiplier: mods.friendship, xp: C.actions.pet.xp,
        }, now, rnd));
      }
      const rewarded = pet !== current;
      return {
        state: rewarded ? track(withPet(pet), { pets: 1 }, now) : withPet(pet),
        interaction: {
          type: 'pet', ok: true, reaction, animation: REACTIONS[reaction].animation,
          dialogue: say('petting', pet, now, rnd, { reaction }),
          narration: reactionNarration(reaction, pet, rnd),
          notice: notices.join(' ') || undefined,
        },
      };
    }

    case 'feed': {
      const food = FOODS[request.food];
      if (!food) return { state: synced, interaction: null };
      if (current.sleep) return refuse(current, 'feed', say('sleeping-touched', current, now, rnd), 'sleep');
      const key = `feed:${food.id}`;
      if (cooling(key) || getQuantity(synced, food.id) < 1) return { state: synced, interaction: null };
      if (current.hunger >= C.actions.feed.blockAboveHunger) {
        return refuse(current, 'feed', say('feeding-full', current, now, rnd));
      }
      const favorite = favoriteFood(current) === food.id;
      const starving = getMood(current) === 'hungry';
      const stocked = removeItems(synced, [{ item: food.id, qty: 1 }])!;
      const { pet, notices } = applyReward(stamp(current, key), {
        hunger: food.hungerRestored * mods.feed,
        happiness: food.happinessBonus + (favorite ? C.actions.feed.favoriteHappiness : 0),
        friendship: C.actions.feed.friendship + (favorite ? C.actions.feed.favoriteFriendship : 0),
        friendshipMultiplier: mods.friendship,
        xp: C.actions.feed.xp,
      }, now, rnd);
      const category = favorite ? 'feeding-favorite' : starving ? 'feeding-starving' : 'feeding';
      return {
        state: track({ ...stocked, pet }, { feeds: 1, care: 1 }, now),
        interaction: {
          type: 'feed', ok: true, animation: 'eat', food: food.id,
          dialogue: say(category, pet, now, rnd, { vars: { food: food.name.toLowerCase() } }),
          notice: notices.join(' ') || undefined,
        },
      };
    }

    case 'play': {
      if (current.sleep) return refuse(current, 'play', say('sleeping-touched', current, now, rnd), 'sleep');
      if (cooling('play')) return { state: synced, interaction: null };
      if (current.energy < C.actions.play.minEnergy) return refuse(current, 'play', say('playing-tired', current, now, rnd), 'yawn');
      if (current.hunger < C.actions.play.minHunger) return refuse(current, 'play', say('playing-hungry', current, now, rnd), 'sad');
      const a = C.actions.play;
      const { pet, notices } = applyReward(stamp(current, 'play'), {
        happiness: a.happiness * mods.play, energy: a.energy * mods.energyCost, hunger: a.hunger,
        friendship: a.friendship, friendshipMultiplier: mods.friendship, xp: a.xp,
      }, now, rnd);
      return {
        state: track(withPet(pet), { plays: 1, care: 1 }, now),
        interaction: { type: 'play', ok: true, animation: 'play', dialogue: say('playing', pet, now, rnd), notice: notices.join(' ') || undefined },
      };
    }

    case 'groom': {
      if (current.sleep) return refuse(current, 'groom', say('sleeping-touched', current, now, rnd), 'sleep');
      if (cooling('groom')) return { state: synced, interaction: null };
      const a = C.actions.groom;
      const { pet, notices } = applyReward(stamp(current, 'groom'), {
        happiness: a.happiness * mods.groom, friendship: a.friendship, friendshipMultiplier: mods.friendship, xp: a.xp,
      }, now, rnd);
      return {
        state: track(withPet(pet), { grooms: 1, care: 1 }, now),
        interaction: { type: 'groom', ok: true, animation: 'groom', dialogue: say('grooming', pet, now, rnd), notice: notices.join(' ') || undefined },
      };
    }

    case 'sleep': {
      if (current.sleep) return { state: synced, interaction: null };
      if (current.energy >= C.sleep.maxEnergyToSleep) return refuse(current, 'sleep', say('sleep-refuse', current, now, rnd));
      const pet: Pet = { ...current, sleep: { since: now } };
      return { state: withPet(pet), interaction: { type: 'sleep', ok: true, animation: 'sleep', dialogue: say('sleep-start', pet, now, rnd) } };
    }

    case 'wake': {
      if (!current.sleep) return { state: synced, interaction: null };
      const pet: Pet = { ...current, sleep: null };
      const groggy = current.energy < C.sleep.groggyBelow;
      return {
        state: withPet(pet),
        interaction: { type: 'wake', ok: true, animation: 'yawn', dialogue: say(groggy ? 'wake-early' : 'wake', pet, now, rnd) },
      };
    }
  }
}
