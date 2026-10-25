// Balance report: `npm run tune`. Shows how often a typical pet completes each trip without retreating.
import { createEgg } from '../src/egg/createEgg';
import { generatePet } from '../src/pet/generatePet';
import { LOCATIONS } from '../src/adventure/locations';
import { DURATIONS, getDuration } from '../src/adventure/config';
import { buildSnapshot } from '../src/adventure/actions';
import { resolveAdventure } from '../src/adventure/resolve';
import { combatStats } from '../src/adventure/stats';
import type { Pet } from '../src/types';

export function typicalPet(level: number, species?: string): Pet {
  for (let i = 0; i < 500; i++) {
    const p = generatePet(createEgg({ id: 'e', seed: `tune-${i}`, now: 0 }), 0);
    if (p.rarity === 'common' && (!species || p.species === species)) return { ...p, level, hunger: 80, happiness: 75, friendship: 20 };
  }
  throw new Error('no pet');
}

const N = 300;
export function rates(pet: Pet, locId: string, dur: string) {
  const loc = LOCATIONS.find((l) => l.id === locId)!;
  const d = getDuration(dur as never);
  let clean = 0, tri = 0, xp = 0, gold = 0;
  for (let i = 0; i < N; i++) {
    const r = resolveAdventure({ id: `t${i}`, locationId: loc.id, petId: pet.id, durationId: d.id, durationMs: d.ms, startedAt: 0, expectedCompletion: d.ms, seed: `seed-${locId}-${dur}-${i}`, energyCost: d.energy, snapshot: buildSnapshot(pet, loc) });
    if (r.outcome !== 'retreat') clean++;
    if (r.outcome === 'triumph') tri++;
    xp += r.xp; gold += r.gold;
  }
  return { clean: clean / N, triumph: tri / N, xp: Math.round(xp / N), gold: Math.round(gold / N) };
}

if (process.argv[1]?.includes('tune-adventure')) {
  const plan: [number, string][] = [[1, 'whispering-forest'], [3, 'moonlit-glade'], [5, 'crystal-mine'], [8, 'echoing-cavern'], [12, 'ancient-ruins'], [14, 'sealed-vault'], [16, 'sunken-cove'], [18, 'tide-cave'], [22, 'ember-ridge'], [26, 'dragon-nest'], [30, 'cosmic-rift'], [34, 'cosmic-rift']];
  for (const [level, loc] of plan) {
    const pet = typicalPet(level);
    console.log(`\nLevel ${level} ${pet.species} (${JSON.stringify(combatStats(pet))}) @ ${loc}`);
    for (const d of DURATIONS) {
      const l = LOCATIONS.find((x) => x.id === loc)!;
      if (!l.durationOptions.includes(d.id)) continue;
      const r = rates(pet, loc, d.id);
      console.log(`  ${d.short.padEnd(4)} clean ${(r.clean * 100).toFixed(0).padStart(3)}%  triumph ${(r.triumph * 100).toFixed(0).padStart(3)}%  avg xp ${String(r.xp).padStart(4)}  gold ${String(r.gold).padStart(5)}`);
    }
  }
}
