import type { Rarity } from '@/types';

/** Warm neutral shell + rarity accent. Art data for the pixel egg. */
export const EGG_PALETTES: Record<Rarity, { base: string; accent: string }> = {
  common:    { base: '#F2EEE5', accent: '#9B9B94' },
  uncommon:  { base: '#EEF5ED', accent: '#7FAF8B' },
  rare:      { base: '#EEF7F8', accent: '#79B7D4' },
  epic:      { base: '#F2EEF8', accent: '#A993D1' },
  legendary: { base: '#FFF6D9', accent: '#E5B85C' },
  mythic:    { base: '#F8EAF4', accent: '#D58BB7' },
};
