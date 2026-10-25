import type { GameState, ItemStack } from '@/types';
import { localDay } from '@/game/friendship';
import { getItem } from '@/inventory/catalog';
import { addItems, spendGold } from '@/inventory/service';
import { track } from '@/progression/track';
import { createRng } from '@/utils/rng';
import { ROTATING_SLOTS, ROTATION_MS, SHOP_LISTINGS, getListing, type ShopListing, type ShopSection } from './listings';

export const currentRotation = (now: number) => Math.floor(now / ROTATION_MS);
export const msUntilRotation = (now: number) => (currentRotation(now) + 1) * ROTATION_MS - now;

export interface ShopEntry {
  listing: ShopListing;
  remaining: number;
}

/**
 * What's on the shelves right now. Staples are always there; everything else rotates every 12 hours,
 * chosen from what the pet's level has unlocked. The pick is seeded, so it's the same for the whole rotation.
 */
export function getShopStock(state: GameState, now: number): ShopEntry[] {
  const level = state.pet?.level ?? 1;
  const rotation = currentRotation(now);
  const bought = state.shop.rotationId === rotation ? state.shop.purchases : {};
  const petId = state.pet?.id ?? 'pet';
  const out: ShopEntry[] = [];
  for (const section of Object.keys(ROTATING_SLOTS) as ShopSection[]) {
    const eligible = SHOP_LISTINGS.filter((l) => l.section === section && l.minLevel <= level);
    const rotating = createRng(`shop:${rotation}:${section}:${petId}`).shuffle(eligible.filter((l) => !l.staple)).slice(0, ROTATING_SLOTS[section]);
    for (const listing of [...eligible.filter((l) => l.staple), ...rotating]) {
      out.push({ listing, remaining: Math.max(0, listing.stock - (bought[listing.id] ?? 0)) });
    }
  }
  return out;
}

/** Starts a fresh rotation's purchase counts. Call when the shop opens. */
export function syncShop(state: GameState, now: number): GameState {
  const rotation = currentRotation(now);
  return state.shop.rotationId === rotation ? state : { ...state, shop: { ...state.shop, rotationId: rotation, purchases: {} } };
}

export type BuyResult = { ok: true; state: GameState; message: string } | { ok: false; reason: string };

export function buyListing(state: GameState, listingId: string, now: number): BuyResult {
  const synced = syncShop(state, now);
  const entry = getShopStock(synced, now).find((e) => e.listing.id === listingId);
  if (!entry) return { ok: false, reason: 'That isn\u2019t on the shelf right now.' };
  if (entry.remaining <= 0) return { ok: false, reason: 'Sold out until the next restock.' };
  const paid = spendGold(synced, entry.listing.price);
  if (!paid) return { ok: false, reason: 'Not enough gold yet.' };
  const next = addItems(paid, [{ item: entry.listing.item, qty: 1 }]);
  const purchases = { ...next.shop.purchases, [listingId]: (next.shop.purchases[listingId] ?? 0) + 1 };
  const done = track({ ...next, shop: { ...next.shop, purchases } }, { purchases: 1, 'gold-spent': entry.listing.price }, now);
  return { ok: true, state: done, message: `Bought ${getItem(entry.listing.item).name}.` };
}

// ── Daily basket: a small free gift so no one is ever stuck without food ──
export const DAILY_BASKET: ItemStack[] = [{ item: 'apple', qty: 3 }, { item: 'berry', qty: 1 }];
export const basketReady = (state: GameState, now: number) => state.shop.basketDay !== localDay(now);

export function claimBasket(state: GameState, now: number): { state: GameState; claimed: boolean } {
  if (!basketReady(state, now)) return { state, claimed: false };
  const next = addItems(state, DAILY_BASKET);
  return { state: { ...next, shop: { ...next.shop, basketDay: localDay(now) } }, claimed: true };
}

export { getListing };
