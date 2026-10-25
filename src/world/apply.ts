import type { GameState } from '@/types';
import { addGold, addItems } from '@/inventory/service';
import { note } from '@/journal/journal';
import { DISCOVERIES, getDiscovery, type DiscoveryDefinition } from './discoveries';

/** Which of a trip's discoveries still count (a one-time find can't be found twice). */
export function planDiscoveries(state: GameState, ids: string[]): DiscoveryDefinition[] {
  const seen = new Set<string>();
  const out: DiscoveryDefinition[] = [];
  for (const id of ids) {
    const d = getDiscovery(id);
    if (!d || (d.unique && (state.progress.flags.includes(`disc:${id}`) || seen.has(id)))) continue;
    seen.add(id);
    out.push(d);
  }
  return out;
}

/** Gives the rewards, sets the flags that open places, NPCs and secret quests, and writes it in the journal. XP is added by the caller. */
export function applyDiscoveries(state: GameState, found: DiscoveryDefinition[], now: number): GameState {
  let s = state;
  const name = s.pet?.name ?? 'Your pet';
  for (const d of found) {
    if (d.reward?.gold) s = addGold(s, d.reward.gold);
    if (d.reward?.items) s = addItems(s, d.reward.items);
    if (d.unique) s = { ...s, progress: { ...s.progress, flags: [...s.progress.flags, `disc:${d.id}`] } };
    s = note(s, 'discoveries', now, d.name, d.text.replace('{name}', name), d.unique ? `disc:${d.id}` : undefined);
  }
  return s;
}

export const discoveryXp = (found: DiscoveryDefinition[]) => found.reduce((n, d) => n + (d.reward?.xp ?? 0), 0);
export const DISCOVERY_COUNT = DISCOVERIES.length;

/** Meeting an NPC for the first time: remembered, counted and noted. */
export function meetNpc(state: GameState, npcId: string, npcName: string, now: number): GameState {
  const flag = `met:${npcId}`;
  if (state.progress.flags.includes(flag)) return state;
  const next = { ...state, progress: { ...state.progress, flags: [...state.progress.flags, flag] } };
  return note(next, 'events', now, `Met ${npcName}`, `${state.pet?.name ?? 'Your pet'} met ${npcName}.`, `npc:${npcId}`);
}
