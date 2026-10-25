import type { CombatStats, Pet } from '@/types';
import { ADVENTURE_CONFIG as A } from '@/adventure/config';
import { combatStatsAtLevel, getEquipmentBonus } from '@/adventure/stats';
import { addExperience } from '@/game/friendship';
import { unlocksForLevels, type Unlock } from './unlocks';

export interface LevelUpInfo {
  from: number;
  to: number;
  before: CombatStats;
  after: CombatStats;
  energyRestored: number;
  /** Things that open up at the new level(s). */
  unlocks: Unlock[];
}

/**
 * The one place XP is granted. Levelling raises stats (they derive from level), restores some energy and
 * reports what it unlocks. Used by adventures and quests alike.
 */
export function grantExperience(pet: Pet, xp: number): { pet: Pet; levelUp: LevelUpInfo | null } {
  const res = addExperience(pet, xp);
  const gained = res.pet.level - pet.level;
  if (gained <= 0) return { pet: res.pet, levelUp: null };
  const restored = Math.min(100 - res.pet.energy, gained * A.levelUpEnergy);
  const next = { ...res.pet, energy: res.pet.energy + restored };
  const bonus = getEquipmentBonus(next);
  return {
    pet: next,
    levelUp: {
      from: pet.level,
      to: next.level,
      before: combatStatsAtLevel(next.baseStats, pet.level, bonus),
      after: combatStatsAtLevel(next.baseStats, next.level, bonus),
      energyRestored: restored,
      unlocks: unlocksForLevels(pet.level + 1, next.level),
    },
  };
}
