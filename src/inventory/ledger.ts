import type { GameState, ItemStack } from '@/types';

// Low-level bookkeeping for gold and item counts. Nothing else touches `state.inventory` directly:
// everything goes through here (or through InventoryService, which wraps this and adds the rules).

export const quantityOf = (state: GameState, id: string): number => state.inventory.items[id] ?? 0;

export function addStacks(state: GameState, stacks: ItemStack[]): GameState {
  if (stacks.length === 0) return state;
  const items = { ...state.inventory.items };
  for (const { item, qty } of stacks) if (qty > 0) items[item] = (items[item] ?? 0) + qty;
  return { ...state, inventory: { ...state.inventory, items } };
}

/** Returns null (and changes nothing) if you don't have enough. */
export function removeStacks(state: GameState, stacks: ItemStack[]): GameState | null {
  const items = { ...state.inventory.items };
  for (const { item, qty } of stacks) {
    if ((items[item] ?? 0) < qty) return null;
    items[item] -= qty;
    if (items[item] <= 0) delete items[item];
  }
  return { ...state, inventory: { ...state.inventory, items } };
}

export const addGoldRaw = (state: GameState, amount: number): GameState =>
  amount ? { ...state, inventory: { ...state.inventory, gold: Math.max(0, state.inventory.gold + Math.round(amount)) } } : state;
