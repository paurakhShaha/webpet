import { useEffect, useMemo, useState } from 'react';
import { Coins, Gift } from 'lucide-react';
import type { GameState } from '@/types';
import { getItem } from '@/inventory/catalog';
import { describeEffects } from '@/inventory/describe';
import { canSell, listInventory, sellItem } from '@/inventory/service';
import { SHOP_SECTIONS, type ShopSection } from '@/shop/listings';
import { basketReady, buyListing, claimBasket, getShopStock, msUntilRotation, syncShop } from '@/shop/shop';
import { NPCS, npcPresent, npcSays, getNpc, type NpcLineKind } from '@/world/npcs';
import { currentWorld } from '@/world';
import { NPC_PORTRAITS } from '@/pixel/npcs';
import { dismissTip } from '@/progression/actions';
import { formatHm } from '@/utils/format';
import { ItemIcon } from './ItemBits';
import { PixelCanvas } from './PixelCanvas';
import { TabLayout } from './TabLayout';
import { Button, EmptyState, GoldPill, RarityBadge, SegTabs, Tip } from './ui';
import type { UpdateGame } from './useGame';
import { useNow } from './useNow';
import type { NavId } from '@/game/navigation';

interface Props {
  game: GameState;
  update: UpdateGame;
  variant: 'popup' | 'sidepanel';
  onNavigate: (id: NavId) => void;
  dots?: Partial<Record<NavId, boolean>>;
  /** Open on this shelf (e.g. when sent here by an NPC). */
  initialSection?: ShopSection;
}

type Tab = ShopSection | 'sell';

export function ShopScreen({ game, update, variant, onNavigate, dots, initialSection }: Props) {
  const now = useNow(30_000);
  const [tab, setTab] = useState<Tab>(initialSection ?? 'food');
  const [talk, setTalk] = useState<{ kind: NpcLineKind; n: number }>({ kind: 'greet', n: Math.floor(Date.now() / 60_000) });
  const pet = game.pet!;

  // Opening the shop starts a fresh restock if one is due.
  useEffect(() => { void update((s) => syncShop(s, Date.now())); }, [update]);

  const stock = useMemo(() => getShopStock(game, now), [game.pet?.level, game.shop, game.pet?.id, Math.floor(now / 60_000)]); // eslint-disable-line react-hooks/exhaustive-deps
  const world = useMemo(() => currentWorld(game, now), [game.world, Math.floor(now / 60_000)]); // eslint-disable-line react-hooks/exhaustive-deps
  const traveler = getNpc('mystery-traveler')!;
  const travelerHere = npcPresent(game, traveler, world);
  // Each shelf has its own shopkeeper; the Traveler only has a shelf when they're around.
  const vendor = (tab === 'sell' ? getNpc('village-merchant') : NPCS.find((n) => n.sells?.includes(tab as ShopSection)))!;
  const say = (kind: NpcLineKind) => setTalk((t) => ({ kind, n: t.n + 1 }));

  const buy = async (id: string) => {
    let ok = false;
    let reason = '';
    await update((s) => {
      const r = buyListing(s, id, Date.now());
      if (r.ok) { ok = true; return r.state; }
      reason = r.reason;
      return s;
    });
    say(ok ? 'bought' : reason.startsWith('Sold') ? 'soldOut' : 'broke');
  };
  const sell = async (id: string, qty: number) => {
    await update((s) => { const r = sellItem(s, id, qty, Date.now()); return r.ok ? r.state : s; });
    say('sold');
  };
  const basket = async () => {
    let claimed = false;
    await update((s) => { const r = claimBasket(s, Date.now()); claimed = r.claimed; return r.state; });
    say(claimed ? 'basket' : 'basketGone');
  };

  const sellable = listInventory(game).filter((i) => canSell(i.id));
  const sections = SHOP_SECTIONS.filter((s) => s.id !== 'traveler' || travelerHere).map((s) => ({ id: s.id as Tab, label: s.label })).concat([{ id: 'sell', label: 'Sell' }]);
  const visible = tab === 'sell' ? [] : stock.filter((e) => e.listing.section === tab);

  return (
    <TabLayout variant={variant} active="shop" onNavigate={onNavigate} dots={dots}>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card">
        <PixelCanvas grid={NPC_PORTRAITS[vendor.id]} scale={4} label={vendor.name} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-text">{vendor.name} <span className="font-normal text-text-muted">· {vendor.role}</span></p>
          <p aria-live="polite" className="text-xs leading-snug text-text-muted">“{npcSays(vendor, talk.kind, { world, level: pet.level, flags: game.progress.flags }, `${talk.n}`) || npcSays(getNpc('village-merchant')!, talk.kind, { world, level: pet.level, flags: game.progress.flags }, `${talk.n}`)}”</p>
        </div>
        <GoldPill gold={game.inventory.gold} />
      </div>
      {!game.progress.tipsSeen.includes('shop') && (
        <Tip onDismiss={() => void update((s) => dismissTip(s, 'shop'))}>Shelves restock every 12 hours, and new things appear as {pet.name} levels up. You can sell materials you don’t need.</Tip>
      )}

      <SegTabs label="Shop sections" value={tab} onChange={(t) => { setTab(t); say('greet'); }} tabs={sections} />

      {tab === 'food' && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background-alt px-3 py-2.5">
          <Gift size={18} className="shrink-0 text-primary-dark" aria-hidden />
          <p className="flex-1 text-xs text-text"><span className="font-bold">Free daily basket</span><br /><span className="text-text-muted">3 apples and a berry, on the house.</span></p>
          <Button className="px-3 py-1.5 text-[13px]" disabled={!basketReady(game, now)} onClick={() => void basket()}>{basketReady(game, now) ? 'Claim' : 'Claimed'}</Button>
        </div>
      )}

      {tab !== 'sell' && (
        <>
          {visible.length === 0 ? <EmptyState>Nothing on this shelf right now.</EmptyState> : (
            <ul className="space-y-2">
              {visible.map(({ listing, remaining }) => {
                const item = getItem(listing.item);
                const afford = game.inventory.gold >= listing.price;
                return (
                  <li key={listing.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card">
                    <ItemIcon item={item} size={42} dim={remaining < 1} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text">{item.name}</p>
                      <p className="truncate text-xs text-text-muted">{describeEffects(item).join(' · ') || item.description}</p>
                      <div className="mt-0.5 flex items-center gap-2"><RarityBadge rarity={item.rarity} /><span className="text-[11px] text-text-muted">{listing.staple ? 'Always in stock' : `${remaining} left`}</span></div>
                    </div>
                    <Button variant={afford ? 'primary' : 'secondary'} className="shrink-0 gap-1 px-3 py-2 text-[13px]" disabled={remaining < 1 || !afford} title={!afford ? 'Not enough gold' : remaining < 1 ? 'Sold out' : undefined} onClick={() => void buy(listing.id)}>
                      <Coins size={14} aria-hidden />{listing.price}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-center text-[11px] text-text-muted">New stock in {formatHm(msUntilRotation(now))}</p>
        </>
      )}

      {tab === 'sell' && (
        sellable.length === 0 ? <EmptyState>You have nothing to sell yet. Adventures bring back materials.</EmptyState> : (
          <ul className="space-y-2">
            {sellable.map((it) => (
              <li key={it.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 shadow-card">
                <ItemIcon item={it} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text">{it.name} <span className="font-normal text-text-muted">×{it.quantity}</span></p>
                  <p className="text-xs text-text-muted">{it.sellValue} gold each</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => void sell(it.id, 1)}>Sell 1</Button>
                  {it.quantity > 1 && <Button variant="ghost" className="px-2 py-1.5 text-xs" onClick={() => void sell(it.id, it.quantity)}>All</Button>}
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </TabLayout>
  );
}
