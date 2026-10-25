import type { Pet, PersonalityId, PetAnimation, ReactionId } from '@/types';
import { getMood } from './mood';

interface ReactionDefinition {
  animation: PetAnimation;
  narration: readonly string[];
  /** Personality-specific narration overrides the default. */
  byPersonality?: Partial<Record<PersonalityId, readonly string[]>>;
}

/** Narration templates use {name}. */
export const REACTIONS: Record<ReactionId, ReactionDefinition> = {
  happy: {
    animation: 'happy',
    narration: ['{name} leans into your touch.', '{name} beams.', '{name} wiggles happily.'],
  },
  sleepy: {
    animation: 'yawn',
    narration: ['{name} yawns and blinks slowly.', '{name} nearly dozes off.'],
    byPersonality: { lazy: ['{name} melts into a puddle of comfort.'] },
  },
  surprised: {
    animation: 'surprised',
    narration: ['{name} startles, then relaxes.', '{name} blinks in surprise.'],
    byPersonality: { curious: ['{name} sniffs at your hand.'], brave: ['{name} stands tall, then softens.'] },
  },
  playful: {
    animation: 'play',
    narration: ['{name} bounces in place.'],
    byPersonality: {
      playful: ['{name} jumps toward your cursor.'],
      adventurous: ['{name} jumps toward your cursor.'],
      mischievous: ['{name} pounces at your cursor.'],
    },
  },
  shy: {
    animation: 'hide',
    narration: ['{name} hides for a moment.'],
  },
};

const BASE: Record<ReactionId, number> = { happy: 40, sleepy: 15, surprised: 15, playful: 20, shy: 10 };

const PERSONALITY_BIAS: Record<PersonalityId, Partial<Record<ReactionId, number>>> = {
  brave: { happy: 15 },
  curious: { surprised: 25 },
  playful: { playful: 35 },
  shy: { shy: 40 },
  lazy: { sleepy: 35 },
  mischievous: { playful: 15, surprised: 10 },
  kind: { happy: 25 },
  adventurous: { playful: 15 },
};

/** Pure: weights depend on personality, mood and how well the pet knows you. */
export function chooseReaction(pet: Pet, rnd: () => number): ReactionId {
  const w = { ...BASE };
  for (const [id, bonus] of Object.entries(PERSONALITY_BIAS[pet.personality])) w[id as ReactionId] += bonus ?? 0;
  if (pet.energy < 30) w.sleepy += 30;
  if (getMood(pet) === 'happy') w.happy += 15;
  if (pet.friendship < 20) w.shy += 15;
  if (pet.friendship >= 60) { w.happy += 15; w.shy = Math.max(2, w.shy - 8); }

  const ids = Object.keys(w) as ReactionId[];
  let roll = rnd() * ids.reduce((sum, id) => sum + w[id], 0);
  for (const id of ids) {
    roll -= w[id];
    if (roll < 0) return id;
  }
  return 'happy';
}

export function reactionNarration(reaction: ReactionId, pet: Pet, rnd: () => number): string {
  const def = REACTIONS[reaction];
  const options = def.byPersonality?.[pet.personality] ?? def.narration;
  return options[Math.floor(rnd() * options.length)].replace('{name}', pet.name);
}
