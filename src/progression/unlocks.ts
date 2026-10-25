import { REGIONS } from '@/world/regions';
import { ITEMS } from '@/inventory/catalog';
import { SHOP_LISTINGS } from '@/shop/listings';
import { QUESTS } from '@/quests/definitions';

export interface Unlock {
  kind: 'area' | 'equipment' | 'cosmetic' | 'quest' | 'item';
  label: string;
}

/** What opens up when a pet reaches exactly this level. Built from the game data, never hand-written. */
export function unlocksAtLevel(level: number): Unlock[] {
  if (level <= 1) return [];
  const out: Unlock[] = [];
  // Places open by level (and sometimes more). The Rift and hidden places are left out so they stay a surprise.
  for (const r of REGIONS) {
    if (r.id === 'village' || r.revealedBy || r.unlock.level !== level) continue;
    out.push({ kind: 'area', label: r.unlock.flags || r.unlock.counters ? `${r.name} (when its other requirements are met)` : r.name });
  }
  for (const listing of SHOP_LISTINGS) {
    if (listing.minLevel !== level) continue;
    const item = ITEMS[listing.item];
    const kind = item.metadata.slot === 'cosmetic' ? 'cosmetic' : item.type === 'equipment' || item.type === 'accessory' ? 'equipment' : 'item';
    if (listing.staple) continue;
    out.push({ kind, label: item.name });
  }
  for (const q of QUESTS) if (q.minLevel === level && (q.type === 'exploration' || q.type === 'story' || q.type === 'achievement')) out.push({ kind: 'quest', label: q.title });
  return out;
}

export function unlocksForLevels(from: number, to: number): Unlock[] {
  const out: Unlock[] = [];
  for (let l = from; l <= to; l++) out.push(...unlocksAtLevel(l));
  return out;
}

/** The next few levels that unlock something. */
export function nextUnlocks(level: number, count = 4): { level: number; unlocks: Unlock[] }[] {
  const out: { level: number; unlocks: Unlock[] }[] = [];
  for (let l = level + 1; l <= 50 && out.length < count; l++) {
    const unlocks = unlocksAtLevel(l);
    if (unlocks.length) out.push({ level: l, unlocks });
  }
  return out;
}
