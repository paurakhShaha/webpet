import type { Expression, Mood, PetAnimation } from '@/types';

/** How long each one-off animation plays before the pet returns to its resting state. */
export const ANIMATION_MS: Record<PetAnimation, number> = {
  idle: 0, blink: 160, bounce: 900, eat: 1800, happy: 1400, sad: 1600, sleep: 0,
  play: 2200, groom: 1600, hide: 1500, surprised: 900, yawn: 1400, levelup: 0,
};

/** Which face each animation wears. */
export const ANIMATION_EXPRESSION: Record<PetAnimation, Expression> = {
  idle: 'normal', blink: 'blink', bounce: 'normal', eat: 'normal', happy: 'happy', sad: 'sad',
  sleep: 'sleep', play: 'happy', groom: 'happy', hide: 'shy', surprised: 'surprised', yawn: 'yawn', levelup: 'happy',
};

/** What the pet does when nothing is going on. */
export function restingAnimation(mood: Mood): PetAnimation {
  if (mood === 'sleeping') return 'sleep';
  if (mood === 'sad') return 'sad';
  return 'idle';
}
