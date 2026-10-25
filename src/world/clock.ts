import type { Season, Weather, WorldNow, WorldState, WorldTime } from '@/types';
import { createRng } from '@/utils/rng';

// The world clock. It follows the player's own local date and time, and nothing else:
// no browsing data, no network. Weather is deterministic from the world seed, so the same moment is always the same weather.

export function worldTimeAt(ts: number): WorldTime {
  const h = new Date(ts).getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

/** Calendar seasons (northern hemisphere). `mode` lets players pick another one. */
export function seasonAt(ts: number, mode: 'auto' | Season = 'auto'): Season {
  if (mode !== 'auto') return mode;
  const m = new Date(ts).getMonth(); // 0 = January
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

const WEATHER_WEIGHTS: Record<Season, Record<Weather, number>> = {
  spring: { clear: 40, rain: 35, storm: 5, fog: 20, snow: 0 },
  summer: { clear: 55, rain: 15, storm: 15, fog: 15, snow: 0 },
  autumn: { clear: 30, rain: 30, storm: 10, fog: 30, snow: 0 },
  winter: { clear: 30, rain: 5, storm: 5, fog: 20, snow: 40 },
};

/** Fog likes the early morning; storms like the evening. */
const TIME_NUDGE: Record<WorldTime, Partial<Record<Weather, number>>> = {
  morning: { fog: 1.8 }, day: {}, evening: { storm: 1.5 }, night: { fog: 1.2 },
};

export const WEATHER_BLOCK_MS = 3 * 3_600_000;

export function weatherAt(seed: string, ts: number, season: Season): Weather {
  const time = worldTimeAt(ts);
  const rng = createRng(`${seed}:weather:${Math.floor(ts / WEATHER_BLOCK_MS)}`);
  const weights = WEATHER_WEIGHTS[season];
  const all = Object.keys(weights) as Weather[];
  return rng.weighted(all, (w) => weights[w] * (TIME_NUDGE[time][w] ?? 1));
}

export function worldAt(world: Pick<WorldState, 'seed' | 'seasonMode'>, ts: number): WorldNow {
  const season = seasonAt(ts, world.seasonMode);
  return { time: worldTimeAt(ts), weather: weatherAt(world.seed, ts, season), season };
}

export const TIME_LABEL: Record<WorldTime, string> = { morning: 'Morning', day: 'Day', evening: 'Evening', night: 'Night' };
export const WEATHER_LABEL: Record<Weather, string> = { clear: 'Clear', rain: 'Rain', storm: 'Storm', snow: 'Snow', fog: 'Fog' };
export const SEASON_LABEL: Record<Season, string> = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' };

/** Time left in the current stretch of weather (it can change every three hours). */
export const msUntilWeatherShift = (ts: number) => WEATHER_BLOCK_MS - (ts % WEATHER_BLOCK_MS);
