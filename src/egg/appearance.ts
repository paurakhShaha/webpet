import type { Egg } from '@/types';
import { createRng } from '@/utils/rng';
import { RARITY_CONFIG } from '@/rarity/config';
import { EGG_PALETTES } from './palette';

export interface EggLook {
  base: string;
  accent: string;
  speckles: { x: number; y: number; size: 1 | 2 }[];
  /** 0..1, from rarity — drives a subtle glow. */
  aura: number;
}

export function getEggLook(egg: Egg): EggLook {
  const rng = createRng(egg.seed).fork('egg-look');
  const count = 5 + Math.round(egg.hiddenTraits.luster * 4);
  return {
    ...EGG_PALETTES[egg.rarity],
    speckles: Array.from({ length: count }, () => ({
      x: rng.int(9, 22), y: rng.int(11, 33), size: rng.chance(0.3) ? 2 : 1,
    })),
    aura: RARITY_CONFIG[egg.rarity].aura,
  };
}
