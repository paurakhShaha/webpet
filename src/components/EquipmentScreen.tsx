import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { EquipSlot, GameState, ItemDefinition } from '@/types';
import { getItem } from '@/inventory/catalog';
import { describeEffects } from '@/inventory/describe';
import { EQUIP_SLOTS, isCosmetic, meetsLevel, slotOf } from '@/inventory/equipment';
import { compareEquip } from '@/inventory/loadout';
import { equipItem, listInventory, unequipSlot } from '@/inventory/service';
import { COMBAT_STAT_KEYS, COMBAT_STAT_LABELS, statBreakdown } from '@/adventure/stats';
import { dismissTip } from '@/progression/actions';
import { ItemIcon } from './ItemBits';
import { PetSprite } from './PetSprite';
import { TabLayout } from './TabLayout';
import { Button, Stage, Tip } from './ui';
import type { UpdateGame } from './useGame';
import type { NavId } from '@/game/navigation';
import { SLOT_ICONS } from './slotIcons';

type SlotKey = EquipSlot | 'cosmetic';

interface Props {
  game: GameState;
  update: UpdateGame;
  variant: 'popup' | 'sidepanel';
  onNavigate: (id: NavId) => void;
  dots?: Partial<Record<NavId, boolean>>;
}

function SlotButton({ slot, label, item, selected, onClick }: { slot: SlotKey; label: string; item: ItemDefinition | null; selected: boolean; onClick: () => void }) {
  const Icon = SLOT_ICONS[slot];
  return (
    <button onClick={onClick} aria-pressed={selected} aria-label={`${label}: ${item ? item.name : 'empty'}`} className="flex flex-col items-center gap-1">
      <span className={`grid size-[52px] place-items-center rounded-lg border-2 bg-surface shadow-card transition ${selected ? 'ring-2 ring-primary-dark' : ''} ${item ? '' : 'border-dashed border-border-hover'}`}
        style={item ? { borderColor: `var(--color-rarity-${item.rarity})` } : undefined}>
        {item ? <ItemIcon item={item} size={34} /> : <Icon size={20} className="text-text-disabled" aria-hidden />}
      </span>
      <span className="text-[11px] font-semibold text-text-muted">{label}</span>
    </button>
  );
}

export function EquipmentScreen({ game, update, variant, onNavigate, dots }: Props) {
  const pet = game.pet!;
  const [slot, setSlot] = useState<SlotKey | null>(null);
  const [preview, setPreview] = useState<string | null | undefined>(undefined); // undefined = nothing hovered
  const [details, setDetails] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const away = !!game.adventure.active;

  const worn = (s: SlotKey): ItemDefinition | null => {
    const id = s === 'cosmetic' ? pet.cosmetic : pet.equipment[s];
    return id ? getItem(id) : null;
  };
  const candidates = slot
    ? listInventory(game).filter((i) => (slot === 'cosmetic' ? isCosmetic(i) : slotOf(i) === slot))
    : [];

  // Hovering (or focusing, or tapping) a candidate previews its effect on the stats.
  const previewSlot = slot && slot !== 'cosmetic' ? slot : null;
  const changes = previewSlot && preview !== undefined ? compareEquip(pet, previewSlot, preview) : null;
  const breakdown = statBreakdown(pet);
  const shownCosmetic = slot === 'cosmetic' && preview !== undefined ? preview : pet.cosmetic;

  const act = async (fn: (s: GameState) => { ok: boolean; state?: GameState; message?: string; reason?: string }) => {
    let msg: string | null = null;
    await update((s) => {
      const r = fn(s);
      msg = r.ok ? r.message ?? null : r.reason ?? null;
      return r.ok && r.state ? r.state : s;
    });
    setNotice(msg);
    setPreview(undefined);
  };

  return (
    <TabLayout variant={variant} active="equipment" onNavigate={onNavigate} dots={dots}>
      <h1 className="text-xl font-bold text-text">Equipment</h1>
      {!game.progress.tipsSeen.includes('equipment') && (
        <Tip onDismiss={() => void update((s) => dismissTip(s, 'equipment'))}>Tap a slot to see what you can wear. Hover over (or tap) an item to preview how it changes your stats before you equip it.</Tip>
      )}
      {away && <p className="border-l-2 border-warning pl-2 text-xs font-semibold text-text">{pet.name} is out on an adventure. You can change gear when they’re home.</p>}

      <Stage className="h-[200px] shrink-0" decor={false}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-3">
            {(['weapon', 'armor'] as const).map((s) => <SlotButton key={s} slot={s} label={EQUIP_SLOTS.find((x) => x.id === s)!.label} item={worn(s)} selected={slot === s} onClick={() => { setSlot(s); setPreview(undefined); setNotice(null); }} />)}
          </div>
          <PetSprite appearance={pet.appearance} element={pet.element} rarity={pet.rarity} scale={4} cosmetic={shownCosmetic} sleeping={!!pet.sleep} />
          <div className="flex flex-col gap-3">
            {(['accessory', 'charm'] as const).map((s) => <SlotButton key={s} slot={s} label={EQUIP_SLOTS.find((x) => x.id === s)!.label} item={worn(s)} selected={slot === s} onClick={() => { setSlot(s); setPreview(undefined); setNotice(null); }} />)}
          </div>
        </div>
      </Stage>
      <div className="-mt-1 flex justify-center">
        <SlotButton slot="cosmetic" label="Style" item={worn('cosmetic')} selected={slot === 'cosmetic'} onClick={() => { setSlot('cosmetic'); setPreview(undefined); setNotice(null); }} />
      </div>

      {slot && (
        <section aria-label="Choose an item" className="anim-rise rounded-lg border border-border bg-surface p-2 shadow-card">
          {worn(slot) && (
            <button
              onMouseEnter={() => setPreview(null)} onMouseLeave={() => setPreview(undefined)} onFocus={() => setPreview(null)} onBlur={() => setPreview(undefined)}
              disabled={away} onClick={() => void act((s) => unequipSlot(s, slot))}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-text transition hover:bg-surface-hover disabled:opacity-50">
              <X size={14} className="text-text-muted" aria-hidden />Take off {worn(slot)!.name}
            </button>
          )}
          {candidates.length === 0 && !worn(slot) && <p className="px-2 py-3 text-xs text-text-muted">Nothing for this slot yet. Try the shop, quests or an adventure.</p>}
          {candidates.length === 0 && worn(slot) && <p className="px-2 py-1 text-xs text-text-muted">No other items for this slot.</p>}
          <ul className="space-y-1">
            {candidates.map((it) => {
              const ok = meetsLevel(pet, it);
              return (
                <li key={it.id}>
                  <button
                    onMouseEnter={() => setPreview(it.id)} onMouseLeave={() => setPreview(undefined)} onFocus={() => setPreview(it.id)} onBlur={() => setPreview(undefined)}
                    onClick={() => (preview === it.id && ok && !away ? void act((s) => equipItem(s, it.id, Date.now())) : setPreview(it.id))}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition hover:bg-surface-hover ${preview === it.id ? 'bg-surface-active' : ''}`}
                  >
                    <ItemIcon item={it} size={32} dim={!ok} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-text">{it.name} <span className="font-normal text-text-muted">×{it.quantity}</span></span>
                      <span className="block truncate text-[11px] text-text-muted">{ok ? (describeEffects(it).join(' · ') || it.description) : `Needs level ${it.metadata.levelRequired}`}</span>
                    </span>
                    {ok && !away && preview === it.id && <span className="inline-flex items-center gap-1 rounded-sm bg-primary px-2 py-1 text-[11px] font-bold text-text-on-primary"><Plus size={11} aria-hidden />Equip</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {candidates.length > 0 && <p className="px-2 pt-1 text-[11px] text-text-muted">Tap an item once to preview, again to equip.</p>}
        </section>
      )}
      {notice && <p role="status" className="border-l-2 border-primary pl-2 text-xs font-semibold text-text">{notice}</p>}

      <section aria-label="Stats" className="rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-text">{pet.name}’s stats</h2>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-text-muted">
            <input type="checkbox" checked={details} onChange={(e) => setDetails(e.target.checked)} className="accent-primary" />Details
          </label>
        </div>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-1.5">
          {COMBAT_STAT_KEYS.map((k) => {
            const c = changes?.find((x) => x.stat === k);
            const changed = !!c && c.delta !== 0;
            return (
              <li key={k} className={`flex items-baseline justify-between gap-2 text-sm ${changes && !changed ? 'opacity-50' : ''}`}>
                <span className="font-semibold text-text-muted">{COMBAT_STAT_LABELS[k]}</span>
                {changed ? (
                  <span className="tabular-nums text-text"><span className="text-text-muted">{c!.before}</span> &rarr; <span className="font-bold">{c!.after}</span>{' '}
                    <span className={`text-xs font-bold ${c!.delta > 0 ? 'text-primary-dark' : 'text-danger'}`}>{c!.delta > 0 ? '+' : ''}{c!.delta}</span></span>
                ) : <span className="font-bold tabular-nums text-text">{breakdown.total[k]}</span>}
              </li>
            );
          })}
        </ul>
        {details && (
          <div className="mt-3 border-t border-border pt-2 text-[11px] text-text-muted">
            <p className="mb-1 font-semibold text-text">Base (level) + Gear + Boost</p>
            <ul className="grid grid-cols-2 gap-x-5 gap-y-0.5 tabular-nums">
              {COMBAT_STAT_KEYS.map((k) => <li key={k}>{COMBAT_STAT_LABELS[k]}: {breakdown.base[k]} + {breakdown.equipment[k]} + {breakdown.temporary[k]}</li>)}
            </ul>
            {pet.boosts.length > 0 && <p className="mt-1.5">Boosts last until the next adventure starts.</p>}
          </div>
        )}
      </section>
      <Button variant="ghost" className="self-center px-3 py-1.5 text-[13px]" onClick={() => onNavigate('inventory')}>Open inventory</Button>
    </TabLayout>
  );
}
