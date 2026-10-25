import type { BaseStats, Egg, Pet, PetAppearance, SpeciesDefinition } from '@/types';
import { createRng, type Rng } from '@/utils/rng';
import { RARITY_CONFIG, isRarityAtLeast, rarityRank } from '@/rarity';
import { EGG_POOLS } from '@/egg/pools';
import { STAT_KEYS } from '@/egg/createEgg';
import { GAME_CONFIG } from '@/game/config';
import { emptyEquipment } from '@/inventory/equipment';
import { getSpecies } from './species';
import { PERSONALITIES } from './personalities';
import { TRAITS } from './traits';

function pickSpecies(egg: Egg, rng: Rng): SpeciesDefinition {
  const pool = EGG_POOLS[egg.speciesPool];
  const ids = Object.keys(pool.speciesWeights);
  return getSpecies(rng.weighted(ids, (id) => pool.speciesWeights[id]));
}

function generateAppearance(species: SpeciesDefinition, egg: Egg, rng: Rng): PetAppearance {
  const options = species.appearance;
  const palette = rng.pick(options.palettes);
  // Higher rarities are less likely to come out plain.
  const markingPool =
    rarityRank(egg.rarity) >= rarityRank('rare') && options.markings.some((m) => m !== 'none')
      ? options.markings.filter((m) => m !== 'none')
      : options.markings;
  return {
    body: rng.pick(options.bodies),
    eyes: rng.pick(options.eyes),
    ears: rng.pick(options.ears),
    tail: rng.pick(options.tails),
    primaryColor: palette.primary,
    secondaryColor: palette.secondary,
    markingColor: palette.marking,
    markings: rng.pick(markingPool),
    paletteName: palette.name,
  };
}

function generateStats(species: SpeciesDefinition, egg: Egg, rng: Rng): BaseStats {
  const { statMultiplier } = RARITY_CONFIG[egg.rarity];
  const personality = PERSONALITIES[egg.hiddenTraits.personalityLean];
  const stats = {} as BaseStats;
  for (const key of STAT_KEYS) {
    let value = species.baseStats[key] + rng.int(-2, 2);
    if (key === egg.hiddenTraits.statBias) value += 3;
    value += personality.statBonus[key] ?? 0;
    stats[key] = Math.max(1, Math.round(value * statMultiplier));
  }
  return stats;
}

/**
 * Pure and deterministic: the same egg always hatches the same pet.
 * Each concern uses its own RNG fork so future additions won't reshuffle old pets.
 */
export function generatePet(egg: Egg, now: number): Pet {
  const rng = createRng(egg.seed);
  const species = pickSpecies(egg, rng.fork('species'));
  const hidden = egg.hiddenTraits;

  const element = species.elements.includes(hidden.elementAffinity)
    ? hidden.elementAffinity
    : rng.fork('element').pick(species.elements);
  const personality = species.personalities.includes(hidden.personalityLean)
    ? hidden.personalityLean
    : rng.fork('personality').pick(species.personalities);

  const eligibleTraits = TRAITS.filter((t) => !t.minRarity || isRarityAtLeast(egg.rarity, t.minRarity));
  const traits = rng
    .fork('traits')
    .shuffle(eligibleTraits)
    .slice(0, RARITY_CONFIG[egg.rarity].traitCount)
    .map((t) => t.id);

  return {
    id: `pet-${egg.seed}`,
    eggId: egg.id,
    name: '',
    originalName: '',
    species: species.id,
    rarity: egg.rarity,
    personality,
    element,
    baseStats: generateStats(species, egg, rng.fork('stats')),
    appearance: generateAppearance(species, egg, rng.fork('appearance')),
    traits,
    createdAt: now,
    ...GAME_CONFIG.petDefaults,
    careUpdatedAt: now,
    sleep: null,
    lastActionAt: {},
    friendshipToday: { day: '', gained: 0 },
    equipment: emptyEquipment(),
    cosmetic: null,
    boosts: [],
  };
}
