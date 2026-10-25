import type { AwaySummary } from '@/types';
import { formatAway } from '@/utils/format';

/** Builds up to two lines describing what happened while the player was away. */
export function awayLines(summary: AwaySummary, name: string): string[] {
  const HOUR = 3_600_000;
  const lines: string[] = [];
  const awake = summary.awayMs - summary.sleptMs;

  if (summary.sleptMs >= 30 * 60_000) {
    lines.push(`While you were away, ${name} slept for ${formatAway(summary.sleptMs)}.`);
    if (summary.wokeUp) lines.push(`${name} woke up feeling fully rested.`);
  }
  if (lines.length < 2 && awake >= HOUR) {
    if (summary.hungerDelta <= -10) lines.push(`${name} got a little hungry waiting for you.`);
    else if (summary.happinessDelta <= -8) lines.push(`${name} missed you a little.`);
    else lines.push(`${name} spent ${formatAway(awake)} wandering around, waiting for you.`);
  }
  if (lines.length === 0) lines.push(`${name} kept themselves busy while you were away.`);
  return lines.slice(0, 2);
}
