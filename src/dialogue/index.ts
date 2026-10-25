import type { DialogueCategory, DialogueContext, DialogueLine, DialogueWhen } from './types';
import { GREETINGS } from './greetings';
import { FEEDING } from './feeding';
import { PLAYING } from './playing';
import { SLEEPING } from './sleeping';
import { GROOMING } from './grooming';
import { PETTING } from './petting';
import { PERSONALITY_LINES } from './personality';
import { NEEDS } from './needs';
import { MILESTONES } from './milestones';
import { WORLD_LINES } from './world';

export * from './types';
export { awayLines } from './away';

const ALL: DialogueLine[] = [
  ...GREETINGS, ...FEEDING, ...PLAYING, ...SLEEPING, ...GROOMING, ...PETTING, ...PERSONALITY_LINES, ...NEEDS, ...MILESTONES, ...WORLD_LINES,
];

const includes = <T>(want: T | T[] | undefined, have: T) =>
  want === undefined || (Array.isArray(want) ? want.includes(have) : want === have);

/** Returns how many conditions matched, or -1 if the line doesn't fit. */
function specificity(when: DialogueWhen | undefined, ctx: DialogueContext): number {
  if (!when) return 0;
  let score = 0;
  const check = (set: boolean, ok: boolean) => { if (set) { if (!ok) score = -Infinity; else score++; } };
  check(when.personality !== undefined, includes(when.personality, ctx.personality));
  check(when.mood !== undefined, includes(when.mood, ctx.mood));
  check(when.timeOfDay !== undefined, includes(when.timeOfDay, ctx.timeOfDay));
  check(when.reaction !== undefined, when.reaction === ctx.reaction);
  check(when.weather !== undefined, ctx.weather !== undefined && includes(when.weather, ctx.weather));
  check(when.worldTime !== undefined, ctx.worldTime !== undefined && includes(when.worldTime, ctx.worldTime));
  check(when.season !== undefined, ctx.season !== undefined && includes(when.season, ctx.season));
  check(when.minFriendship !== undefined, ctx.friendship >= (when.minFriendship ?? 0));
  check(when.maxFriendship !== undefined, ctx.friendship <= (when.maxFriendship ?? 100));
  check(when.minHappiness !== undefined, ctx.happiness >= (when.minHappiness ?? 0));
  check(when.maxHappiness !== undefined, ctx.happiness <= (when.maxHappiness ?? 100));
  return score < 0 ? -1 : score;
}

const fill = (text: string, ctx: DialogueContext) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => (key === 'name' ? ctx.name : ctx.vars?.[key] ?? ''));

/**
 * Picks a line for the situation. Lines that match more of the context
 * (personality, mood, time of day, friendship…) are favoured, so the pet
 * sounds like itself without every line being hand-scripted per case.
 */
export function chooseDialogue(category: DialogueCategory, ctx: DialogueContext, rnd: () => number): string {
  const pool = ALL.filter((l) => l.category === category)
    .map((l) => ({ l, score: specificity(l.when, ctx) }))
    .filter((c) => c.score >= 0);
  if (pool.length === 0) return '';
  const weight = (c: { l: DialogueLine; score: number }) => (c.l.weight ?? 1) * (1 + c.score * 2);
  let roll = rnd() * pool.reduce((sum, c) => sum + weight(c), 0);
  for (const c of pool) {
    roll -= weight(c);
    if (roll < 0) return fill(c.l.text, ctx);
  }
  return fill(pool[pool.length - 1].l.text, ctx);
}
