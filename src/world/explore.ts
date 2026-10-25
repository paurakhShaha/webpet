import type { LocationDefinition, Season } from '@/types';
import { createRng } from '@/utils/rng';
import { DISCOVERIES, type DiscoveryDefinition } from './discoveries';
import { weatherAt, worldTimeAt } from './clock';

const HOUR = 3_600_000;

/** How many times a trip stops to look around: about three every four hours, at least one. */
export const explorationRolls = (durationMs: number) => Math.max(1, Math.round((durationMs / HOUR) * 0.75 + 0.25));

export interface ExploreInput {
  loc: LocationDefinition;
  seed: string;
  world: { seed: string; season: Season; known: string[] };
  startedAt: number;
  durationMs: number;
  level: number;
  luck: number;
}

/**
 * Which discoveries a trip stumbles on. Pure and deterministic from the trip's seed, and it can't find a
 * one-time discovery twice. Time of day, weather and season at each stop change what is possible and how likely it is.
 */
export function rollDiscoveries(input: ExploreInput): string[] {
  const { loc, world, startedAt, durationMs, level, luck } = input;
  const rng = createRng(`${input.seed}:explore`);
  const rolls = explorationRolls(durationMs);
  const have = new Set(world.known);
  const found: DiscoveryDefinition[] = [];

  for (let i = 0; i < rolls; i++) {
    const ts = startedAt + (durationMs * (i + 0.5)) / rolls;
    const time = worldTimeAt(ts);
    const weather = weatherAt(world.seed, ts, world.season);
    const rrng = rng.fork(`roll-${i}`);

    const eligible = DISCOVERIES.filter((d) => {
      if (!d.regions.includes(loc.region) || (d.locations && !d.locations.includes(loc.id))) return false;
      if (d.unique && (have.has(`disc:${d.id}`) || found.some((f) => f.id === d.id))) return false;
      const w = d.when;
      if (!w) return true;
      return (!w.time || w.time.includes(time)) && (!w.weather || w.weather.includes(weather)) && (!w.season || w.season.includes(world.season))
        && (!w.minLevel || level >= w.minLevel) && (!w.flags || w.flags.every((f) => have.has(f)));
    });

    for (const d of rrng.fork('order').shuffle(eligible)) {
      const mult = (d.boost?.time?.[time] ?? 1) * (d.boost?.weather?.[weather] ?? 1);
      if (rrng.fork(d.id).chance(Math.min(0.6, d.chance * mult * (1 + luck * 0.004)))) { found.push(d); break; }
    }
  }
  return found.map((d) => d.id);
}
