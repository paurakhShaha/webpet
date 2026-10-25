import type { CombatStats, EnemyDefinition } from '@/types';
import type { Rng } from '@/utils/rng';

export interface Fighter {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
  magic: number;
}

export interface BattleResult {
  won: boolean;
  /** Pet HP after the fight (0 if it lost). */
  petHp: number;
  rounds: number;
}

/** An enemy scaled for a location. HP, attack and defense grow with its power; speed grows more gently. */
export function scaleEnemy(enemy: EnemyDefinition, power: number): Fighter {
  return {
    hp: Math.round(enemy.hp * power),
    attack: enemy.attack * Math.pow(power, 0.9),
    defense: enemy.defense * Math.pow(power, 0.9),
    speed: enemy.speed * (1 + (power - 1) * 0.3),
    luck: 4,
    magic: 0,
  };
}

const variance = (rng: Rng) => rng.float(0.85, 1.15);

/**
 * One automatic fight. Deterministic for a given rng.
 * Stats decide how it goes: Attack/Magic deal damage, Defense soaks it, Speed picks who opens,
 * Luck gives crits and dodges. Randomness only adds swing; it doesn't decide the winner on its own.
 */
export function simulateBattle(
  pet: Fighter & { currentHp: number },
  enemy: Fighter,
  enemyMagical: boolean,
  rng: Rng,
): BattleResult {
  let petHp = pet.currentHp;
  let enemyHp = enemy.hp;
  const critChance = Math.min(0.4, 0.04 + pet.luck * 0.006);
  const dodgeChance = Math.min(0.25, pet.luck * 0.004);
  const spellChance = pet.magic / (pet.magic + 60) * 0.5;
  let petTurn = pet.speed + rng.float(0, 6) >= enemy.speed + rng.float(0, 6);

  for (let round = 1; round <= 40; round++) {
    if (petTurn) {
      let dmg: number;
      if (rng.chance(spellChance)) dmg = pet.magic * 0.9 * variance(rng) - enemy.defense * 0.15;
      else dmg = pet.attack * variance(rng) - enemy.defense * 0.6;
      if (rng.chance(critChance)) dmg *= 1.6;
      enemyHp -= Math.max(1, dmg);
      if (enemyHp <= 0) return { won: true, petHp, rounds: round };
    } else if (!rng.chance(dodgeChance)) {
      let dmg = enemy.attack * variance(rng) - pet.defense * (enemyMagical ? 0.3 : 0.6);
      if (rng.chance(0.05)) dmg *= 1.5;
      petHp -= Math.max(1, dmg);
      if (petHp <= 0) return { won: false, petHp: 0, rounds: round };
    }
    petTurn = !petTurn;
  }
  return { won: petHp >= enemyHp, petHp: Math.max(1, petHp), rounds: 40 };
}

export const toFighter = (s: CombatStats, multiplier: number): Fighter => ({
  hp: Math.round(s.hp * multiplier),
  attack: s.attack * multiplier,
  defense: s.defense * multiplier,
  speed: s.speed * multiplier,
  magic: s.magic * multiplier,
  luck: s.luck,
});
