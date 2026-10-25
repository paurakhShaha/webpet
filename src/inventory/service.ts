import type { Boost, EquipSlot, GameState, InventoryItem, ItemStack, ItemType } from '@/types';
import { track } from '@/progression/track';
import { ITEMS, getItem } from './catalog';
import { isCosmetic, meetsLevel, slotOf } from './equipment';
import { addGoldRaw, addStacks, quantityOf, removeStacks } from './ledger';

/**
 * InventoryService: the single place that changes what the player owns.
 * Adventures, quests, the shop and feeding all go through these functions, so rules (can't go negative,
 * equipped items leave the bag, selling limits…) exist exactly once. All functions are pure.
 */

export type Result = { ok: true; state: GameState; message?: string } | { ok: false; reason: string };
const fail = (reason: string): Result => ({ ok: false, reason });

export const getQuantity = quantityOf;
export const getGold = (state: GameState) => state.inventory.gold;
export const hasItems = (state: GameState, stacks: ItemStack[]) => stacks.every((s) => quantityOf(state, s.item) >= s.qty);

export function addItems(state: GameState, stacks: ItemStack[]): GameState {
  return addStacks(state, stacks.filter((s) => ITEMS[s.item]));
}
export const removeItems = (state: GameState, stacks: ItemStack[]) => removeStacks(state, stacks);

export const addGold = (state: GameState, amount: number): GameState => addGoldRaw(state, amount);
export function spendGold(state: GameState, amount: number): GameState | null {
  return state.inventory.gold >= amount ? addGoldRaw(state, -amount) : null;
}

const RARITY_ORDER = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

/** Everything owned, as full item records with quantities. */
export function listInventory(state: GameState, type?: ItemType): InventoryItem[] {
  return Object.entries(state.inventory.items)
    .filter(([id, n]) => n > 0 && ITEMS[id] && (!type || ITEMS[id].type === type))
    .map(([id, n]) => ({ ...ITEMS[id], quantity: n }))
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.name.localeCompare(b.name));
}

// ── Selling ──────────────────────────────────────────────────

export const canSell = (id: string) => !!ITEMS[id] && ITEMS[id].sellValue > 0 && !ITEMS[id].metadata.unsellable;

export function sellItem(state: GameState, id: string, qty: number, now: number): Result & { earned?: number } {
  if (!canSell(id)) return fail('That can\u2019t be sold.');
  const amount = Math.max(1, Math.floor(qty));
  const removed = removeStacks(state, [{ item: id, qty: amount }]);
  if (!removed) return fail('You don\u2019t have that many.');
  const earned = getItem(id).sellValue * amount;
  const next = track(addGoldRaw(removed, earned), { sales: amount, 'gold-earned': earned }, now);
  return { ok: true, state: next, earned, message: `Sold ${amount} \u00d7 ${getItem(id).name} for ${earned} gold.` };
}

// ── Equipment ────────────────────────────────────────────────

/** Puts an item on. What was worn in that slot goes back to the bag. Worn items are not in the bag. */
export function equipItem(state: GameState, id: string, now: number): Result {
  const pet = state.pet;
  const item = ITEMS[id];
  if (!pet || !item) return fail('Nothing to equip.');
  if (state.adventure.active) return fail('Wait until your pet is home.');
  if (quantityOf(state, id) < 1) return fail('You don\u2019t have that.');
  if (!meetsLevel(pet, item)) return fail(`${pet.name} needs to be level ${item.metadata.levelRequired} to wear this.`);

  let next = removeStacks(state, [{ item: id, qty: 1 }])!;
  if (isCosmetic(item)) {
    if (pet.cosmetic) next = addStacks(next, [{ item: pet.cosmetic, qty: 1 }]);
    next = { ...next, pet: { ...pet, cosmetic: id } };
  } else {
    const slot = slotOf(item);
    if (!slot) return fail('That can\u2019t be worn.');
    const previous = pet.equipment[slot];
    if (previous) next = addStacks(next, [{ item: previous, qty: 1 }]);
    next = { ...next, pet: { ...pet, equipment: { ...pet.equipment, [slot]: id } } };
  }
  return { ok: true, state: track(next, { equips: 1 }, now), message: `${pet.name} is now wearing ${item.name}.` };
}

export function unequipSlot(state: GameState, slot: EquipSlot | 'cosmetic'): Result {
  const pet = state.pet;
  if (!pet) return fail('Nothing to remove.');
  if (state.adventure.active) return fail('Wait until your pet is home.');
  const id = slot === 'cosmetic' ? pet.cosmetic : pet.equipment[slot];
  if (!id) return fail('Nothing is equipped there.');
  const next = addStacks(state, [{ item: id, qty: 1 }]);
  return {
    ok: true,
    state: { ...next, pet: slot === 'cosmetic' ? { ...pet, cosmetic: null } : { ...pet, equipment: { ...pet.equipment, [slot]: null } } },
  };
}

// ── Using items ──────────────────────────────────────────────

/** Tonics and other special items. (Food is eaten through feeding, so cooldowns and reactions stay in one place.) */
export function useSpecial(state: GameState, id: string): Result {
  const pet = state.pet;
  const item = ITEMS[id];
  if (!pet || !item || item.type !== 'special') return fail('That can\u2019t be used.');
  if (state.adventure.active) return fail('Wait until your pet is home.');
  if (pet.sleep) return fail(`${pet.name} is asleep.`);
  const energy = item.effects.find((e) => e.kind === 'energy');
  if (energy && pet.energy >= 95) return fail(`${pet.name} isn\u2019t tired.`);
  const removed = removeStacks(state, [{ item: id, qty: 1 }]);
  if (!removed) return fail('You don\u2019t have any.');

  let nextPet = pet;
  if (energy) nextPet = { ...nextPet, energy: Math.min(100, nextPet.energy + energy.amount) };
  const boosts: Boost[] = item.effects.flatMap((e) => (e.kind === 'boost' ? [{ stat: e.stat, amount: e.amount, source: id }] : []));
  if (boosts.length) nextPet = { ...nextPet, boosts: [...nextPet.boosts.filter((b) => b.source !== id), ...boosts] };
  return { ok: true, state: { ...removed, pet: nextPet }, message: boosts.length ? `${item.name} will help on the next adventure.` : `${pet.name} feels refreshed.` };
}

export const InventoryService = {
  getQuantity, getGold, hasItems, addItems, removeItems, addGold, spendGold, listInventory, canSell, sellItem, equipItem, unequipSlot, useSpecial,
};
