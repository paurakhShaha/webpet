import type { Pet, ReactionId, WorldNow } from '@/types';
import { chooseDialogue, type DialogueCategory, type DialogueContext } from '@/dialogue';
import { getMood, timeOfDay } from './mood';

export function talkContext(pet: Pet, now: number, extra: { reaction?: ReactionId; vars?: Record<string, string>; world?: WorldNow } = {}): DialogueContext {
  const { world, ...rest } = extra;
  return {
    name: pet.name,
    personality: pet.personality,
    mood: getMood(pet),
    happiness: pet.happiness,
    friendship: pet.friendship,
    timeOfDay: timeOfDay(now),
    ...(world ? { weather: world.weather, worldTime: world.time, season: world.season } : {}),
    ...rest,
  };
}

export const say = (
  category: DialogueCategory, pet: Pet, now: number, rnd: () => number,
  extra: { reaction?: ReactionId; vars?: Record<string, string>; world?: WorldNow } = {},
) => chooseDialogue(category, talkContext(pet, now, extra), rnd);

/** Something to say unprompted: a need if there is one, otherwise personality chatter. */
export function ambientLine(pet: Pet, now: number, rnd: () => number, world?: WorldNow): string {
  const mood = getMood(pet);
  // Now and then, remark on the weather, the hour or the season.
  if (world && (world.weather !== 'clear' || world.time === 'night') && rnd() < 0.3) {
    const w = say('weather', pet, now, rnd, { world });
    if (w) return w;
  }
  const needs = { hungry: 'need-hungry', tired: 'need-tired', sad: 'need-sad' } as const;
  if (mood in needs && rnd() < 0.6) return say(needs[mood as keyof typeof needs], pet, now, rnd);
  return say('ambient', pet, now, rnd);
}
