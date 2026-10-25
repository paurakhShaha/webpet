import { useMemo, useState } from 'react';
import { Coins, Shirt } from 'lucide-react';
import type { GameState, InventoryItem, ItemType } from '@/types';
import { ITEM_TYPES } from '@/inventory/catalog';
import { describeEffects, SLOT_LABEL, TYPE_LABEL } from '@/inventory/describe';
import { equipItem, listInventory, sellItem, useSpecial, canSell } from '@/inventory/service';
import { meetsLevel } from '@/inventory/equipment';
import { applyCare } from '@/game/careActions';
import { isPetAway } from '@/adventure/defaults';
import { dismissTip } from '@/progression/actions';
import { ItemIcon } from './ItemBits';
import { Button, EmptyState, GoldPill, RarityBadge, SegTabs, Tip } from './ui';
import { TabLayout } from './TabLayout';
import type { UpdateGame } from './useGame';
import type { NavId } from '@/game/navigation';

interface Props {
  game: GameState;
  update: UpdateGame;
  variant: 'popup' | 'sidepanel';
  onNavigate: (id: NavId) => void;
  dots?: Partial<Record<NavId, boolean>>;
}

export function InventoryScreen({ game, update, variant, onNavigate, dots }: Props) {
  const [type, setType] = useState<ItemType>('food');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pet = game.pet!;
  const away = isPetAway(game, Date.now()) || !!game.adventure.active;

  const all = useMemo(() => listInventory(game), [game.inventory.items]); // eslint-disable-line react-hooks/exhaustive-deps
  const items = all.filter((i) => i.type === type);
  const selected = all.find((i) => i.id === selectedId && i.type === type) ?? null;
  const counts = (t: ItemType) => all.filter((i) => i.type === t).length;

  const run = async (fn: (s: GameState) => { state: GameState; message?: string } | { ok: false; reason: string } | { ok: true; state: GameState; message?: string }) => {
    let message: string | null = null;
    await update((s) => {
      const res = fn(s) as { ok?: boolean; state?: GameState; message?: string; reason?: string };
      if (res.ok === false) { message = res.reason ?? null; return s; }
      message = res.message ?? null;
      return res.state ?? s;
    });
    setNotice(message);
  };

  const feed = async (it: InventoryItem) => {
    let said: string | null = null;
    await update((s) => {
      const out = applyCare(s, { type: 'feed', food: it.id }, Date.now());
      said = out.interaction ? out.interaction.dialogue : 'Not right now — give them a moment.';
      return out.state;
    });
    setNotice(said);
  };

  const feedBlock = pet.sleep ? `${pet.name} is asleep.` : away ? `${pet.name} is out on an adventure.` : null;

  return (
    <TabLayout variant={variant} active="inventory" onNavigate={onNavigate} dots={dots}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Inventory</h1>
        <GoldPill gold={game.inventory.gold} />
      </div>
      {!game.progress.tipsSeen.includes('inventory') && (
        <Tip onDismiss={() => void update((s) => dismissTip(s, 'inventory'))}>Everything you collect is kept here. Tap an item to see what it does, then use, wear or sell it.</Tip>
      )}

      <SegTabs label="Item categories" value={type} onChange={(t) => { setType(t); setSelectedId(null); setNotice(null); }}
        tabs={ITEM_TYPES.map((t) => ({ id: t.id, label: t.label, badge: counts(t.id) || undefined }))} />

      {items.length === 0 ? (
        <EmptyState>
          {type === 'food' ? 'No food right now. The shop and the free daily basket have more.' : type === 'material' ? 'Materials found on adventures will appear here.' : 'Nothing here yet.'}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {items.map((it) => (
            <li key={it.id}>
              <button
                onClick={() => { setSelectedId(it.id); setNotice(null); }}
                aria-pressed={selected?.id === it.id}
                className={`flex w-full flex-col items-center gap-1 rounded-lg border bg-surface px-1.5 py-2.5 shadow-card transition hover:bg-surface-hover ${selected?.id === it.id ? 'border-border-selected' : 'border-border hover:border-border-hover'}`}
              >
                <ItemIcon item={it} size={40} />
                <span className="line-clamp-1 w-full text-center text-[12px] font-semibold text-text">{it.name}</span>
                <span className="text-[11px] tabular-nums text-text-muted">&times;{it.quantity}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <section aria-label={`${selected.name} details`} className="anim-rise space-y-2 rounded-lg border border-border bg-surface p-3.5 shadow-card">
          <div className="flex items-start gap-3">
            <ItemIcon item={selected} size={44} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold leading-tight text-text">{selected.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <RarityBadge rarity={selected.rarity} />
                <span>{selected.metadata.slot ? SLOT_LABEL[selected.metadata.slot] : TYPE_LABEL[selected.type]}</span>
                {selected.metadata.levelRequired && selected.metadata.levelRequired > 1 ? <span>Level {selected.metadata.levelRequired}+</span> : null}
              </div>
            </div>
          </div>
          <p className="text-xs leading-snug text-text-muted">{selected.description}</p>
          {describeEffects(selected).length > 0 && <p className="text-xs font-semibold text-text">{describeEffects(selected).join(' · ')}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            {selected.type === 'food' && <Button className="px-4 py-2 text-[13px]" disabled={!!feedBlock} title={feedBlock ?? undefined} onClick={() => void feed(selected)}>Feed {pet.name}</Button>}
            {selected.type === 'special' && <Button className="px-4 py-2 text-[13px]" onClick={() => void run((s) => useSpecial(s, selected.id))}>Use</Button>}
            {(selected.type === 'equipment' || selected.type === 'accessory') && (
              <Button
                className="px-4 py-2 text-[13px]"
                icon={selected.metadata.slot === 'cosmetic' ? Shirt : undefined}
                disabled={!meetsLevel(pet, selected)}
                title={!meetsLevel(pet, selected) ? `Needs level ${selected.metadata.levelRequired}` : undefined}
                onClick={() => void run((s) => equipItem(s, selected.id, Date.now()))}
              >
                {selected.metadata.slot === 'cosmetic' ? 'Wear' : 'Equip'}
              </Button>
            )}
            {canSell(selected.id) && (
              <>
                <Button variant="secondary" className="px-3 py-2 text-[13px]" icon={Coins} onClick={() => void run((s) => sellItem(s, selected.id, 1, Date.now()))}>Sell 1 · {selected.sellValue}</Button>
                {selected.quantity > 1 && (
                  <Button variant="ghost" className="px-3 py-2 text-[13px]" onClick={() => void run((s) => sellItem(s, selected.id, selected.quantity, Date.now()))}>Sell all · {selected.sellValue * selected.quantity}</Button>
                )}
              </>
            )}
          </div>
        </section>
      )}
      {notice && <p role="status" className="border-l-2 border-primary pl-2 text-xs font-semibold text-text">{notice}</p>}
    </TabLayout>
  );
}
