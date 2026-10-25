import type { GameState, ItemStack } from '@/types';
import { addGoldRaw, addStacks } from '@/inventory/ledger';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (state: GameState) => boolean;
  reward?: { gold?: number; items?: ItemStack[] };
}

const counter = (s: GameState, k: string) => s.progress.counters[k] ?? 0;

/** ADD AN ACHIEVEMENT: append here. It is checked after every event and, once earned, kept forever. */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Name your new companion.', icon: 'footprints', check: (s) => !!s.pet?.originalName },
  { id: 'first-adventure', name: 'First Adventure', description: 'Complete your first adventure.', icon: 'compass', check: (s) => counter(s, 'adventures') >= 1, reward: { gold: 25 } },
  { id: 'first-level-up', name: 'First Level Up', description: 'Reach level 2.', icon: 'trending-up', check: (s) => (s.pet?.level ?? 1) >= 2, reward: { gold: 25 } },
  { id: 'well-fed', name: 'Well Fed', description: 'Feed your pet 25 times.', icon: 'utensils', check: (s) => counter(s, 'feeds') >= 25, reward: { gold: 40 } },
  { id: 'fashionable', name: 'Fashionable', description: 'Wear a cosmetic.', icon: 'crown', check: (s) => !!s.pet?.cosmetic },
  { id: 'treasure-hunter', name: 'Treasure Hunter', description: 'Find 5 rare treasures.', icon: 'gem', check: (s) => counter(s, 'treasures') >= 5, reward: { gold: 100 } },
  { id: 'collector', name: 'Collector', description: 'Own 10 different kinds of item.', icon: 'backpack', check: (s) => Object.values(s.inventory.items).filter((n) => n > 0).length >= 10, reward: { gold: 50 } },
  { id: 'dungeon-explorer', name: 'Dungeon Explorer', description: 'Complete an adventure in every location.', icon: 'map', check: (s) => ['whispering-forest', 'crystal-mine', 'ancient-ruins'].every((l) => counter(s, `adventures:${l}`) >= 1), reward: { gold: 150 } },
  { id: 'veteran', name: 'Veteran', description: 'Complete 25 adventures.', icon: 'medal', check: (s) => counter(s, 'adventures') >= 25, reward: { gold: 150 } },
  { id: 'best-friends', name: 'Best Friends', description: 'Become Best Friends (80 friendship).', icon: 'heart', check: (s) => (s.pet?.friendship ?? 0) >= 80, reward: { items: [{ item: 'star-clip', qty: 1 }] } },
  { id: 'soul-companion', name: 'Soul Companion', description: 'Reach 100 friendship.', icon: 'sparkles', check: (s) => (s.pet?.friendship ?? 0) >= 100, reward: { gold: 300 } },
];

export const getAchievement = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);

/** Unlocks anything newly earned. Permanent: earned achievements are never removed. */
export function evaluateAchievements(state: GameState, now: number): GameState {
  if (!state.pet) return state;
  const earned = ACHIEVEMENTS.filter((a) => !state.progress.achievements[a.id] && a.check(state));
  if (earned.length === 0) return state;
  let next = state;
  const achievements = { ...state.progress.achievements };
  for (const a of earned) {
    achievements[a.id] = now;
    if (a.reward?.gold) next = addGoldRaw(next, a.reward.gold);
    if (a.reward?.items) next = addStacks(next, a.reward.items);
  }
  return {
    ...next,
    progress: { ...next.progress, achievements, unseenAchievements: [...next.progress.unseenAchievements, ...earned.map((a) => a.id)] },
  };
}
