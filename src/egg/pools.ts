import type { EggPoolDefinition, EggPoolId } from '@/types';

/** Which species an egg can hatch into. */
export const EGG_POOLS: Record<EggPoolId, EggPoolDefinition> = {
  forest: {
    id: 'forest', label: 'Forest', hint: 'Smells faintly of pine and rain.',
    speciesWeights: { fox: 3, wolf: 3, rabbit: 1, slime: 1 },
  },
  meadow: {
    id: 'meadow', label: 'Meadow', hint: 'Warm, like grass in the afternoon.',
    speciesWeights: { rabbit: 3, dog: 2, cat: 1, fox: 1 },
  },
  hearth: {
    id: 'hearth', label: 'Hearth', hint: 'Feels like a blanket by a fire.',
    speciesWeights: { cat: 3, dog: 3, fox: 1, rabbit: 1 },
  },
  moonlit: {
    id: 'moonlit', label: 'Moonlit', hint: 'Cool, and very quiet.',
    speciesWeights: { wolf: 3, cat: 2, fox: 2, slime: 1 },
  },
  dew: {
    id: 'dew', label: 'Dew', hint: 'Faintly damp, faintly glowing.',
    speciesWeights: { slime: 4, rabbit: 2, cat: 1 },
  },
};

export const EGG_POOL_IDS = Object.keys(EGG_POOLS);
