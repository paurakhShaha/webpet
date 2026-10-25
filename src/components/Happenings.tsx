import { useState } from 'react';
import { Coins, Eye, Flower2, MapPin, Sparkles, Star, Store, type LucideIcon } from 'lucide-react';
import type { GameState } from '@/types';
import type { LevelUpInfo } from '@/progression/xp';
import { EVENT_ENERGY, buyFromEvent, eventRegionName, getEventDef, investigateEvent, merchantStock, type EventKind, type EventReport, type WorldEventInstance } from '@/world/events';
import { formatHm } from '@/utils/format';
import { ItemChip } from './AdventureBits';
import { Button } from './ui';
import type { UpdateGame } from './useGame';

const KIND_ICON: Record<EventKind, LucideIcon> = { merchant: Store, creature: Eye, meteor: Star, flower: Flower2, map: MapPin };

interface Props {
  game: GameState;
  update: UpdateGame;
  events: WorldEventInstance[];
  now: number;
  onLevelUp: (info: LevelUpInfo) => void;
  /** Hide the place name when already inside that place. */
  inRegion?: boolean;
}

/** Things happening in the world right now: a merchant in town, a meteor, a rare bloom… */
export function Happenings({ game, update, events, now, onLevelUp, inRegion = false }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [reports, setReports] = useState<Record<string, EventReport & { name: string }>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const pet = game.pet!;

  const investigate = async (ev: WorldEventInstance) => {
    let report: (EventReport & { name: string }) | null = null;
    let reason: string | null = null;
    await update((s) => {
      const r = investigateEvent(s, ev.id, Date.now());
      if (!r.ok) { reason = r.reason; return s; }
      report = { ...r.report, name: getEventDef(ev.type)!.name };
      return r.state;
    });
    const rep = report as (EventReport & { name: string }) | null;
    if (rep) { setReports((p) => ({ ...p, [ev.id]: rep })); setNotice(null); if (rep.levelUp) onLevelUp(rep.levelUp); }
    else setNotice(reason);
  };

  const buy = async (ev: WorldEventInstance, item: string) => {
    let msg: string | null = null;
    await update((s) => { const r = buyFromEvent(s, ev.id, item, Date.now()); msg = r.ok ? r.message : r.reason; return r.ok ? r.state : s; });
    setNotice(msg);
  };

  const doneCards = Object.entries(reports).filter(([id]) => !events.some((e) => e.id === id));
  if (events.length === 0 && doneCards.length === 0) return null;

  return (
    <section aria-label="Happening now" className="space-y-2">
      <h2 className="inline-flex items-center gap-1.5 text-[13px] font-bold text-text"><Sparkles size={14} className="text-warning" aria-hidden />Happening now</h2>
      {notice && <p role="status" className="border-l-2 border-warning pl-2 text-xs font-semibold text-text">{notice}</p>}
      <ul className="space-y-2">
        {events.map((ev) => {
          const def = getEventDef(ev.type)!;
          const Icon = KIND_ICON[def.kind];
          const wares = def.kind === 'merchant' && open === ev.id ? merchantStock(game, ev) : [];
          return (
            <li key={ev.id} className="anim-rise rounded-lg border border-border bg-surface p-3 shadow-card">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-yellow/30 text-text"><Icon size={18} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight text-text">{def.name}</p>
                  <p className="mt-0.5 text-xs leading-snug text-text-muted">{def.description}</p>
                  <p className="mt-1 text-[11px] font-semibold text-text-muted">{inRegion ? '' : `${eventRegionName(ev)} · `}{formatHm(ev.endsAt - now)} left{def.kind !== 'merchant' ? ` · ${EVENT_ENERGY} energy` : ''}</p>
                </div>
                <Button className="shrink-0 px-3 py-2 text-[13px]" variant={def.kind === 'merchant' ? 'secondary' : 'primary'}
                  disabled={def.kind !== 'merchant' && (!!pet.sleep || !!game.adventure.active || pet.energy < EVENT_ENERGY)}
                  title={pet.sleep ? `${pet.name} is asleep` : game.adventure.active ? `${pet.name} is away` : pet.energy < EVENT_ENERGY ? 'Too tired' : undefined}
                  onClick={() => (def.kind === 'merchant' ? setOpen(open === ev.id ? null : ev.id) : void investigate(ev))}>
                  {def.kind === 'merchant' && open === ev.id ? 'Close' : def.action}
                </Button>
              </div>
              {wares.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-border pt-2">
                  {wares.map((w) => (
                    <li key={w.item} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1"><ItemChip item={w.item} /></span>
                      <Button variant={game.inventory.gold >= w.price ? 'primary' : 'secondary'} className="shrink-0 gap-1 px-2.5 py-1.5 text-xs" disabled={w.remaining < 1 || game.inventory.gold < w.price} onClick={() => void buy(ev, w.item)}>
                        <Coins size={12} aria-hidden />{w.price}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        {doneCards.map(([id, r]) => (
          <li key={id} className="anim-rise rounded-lg border border-border-selected bg-surface p-3 shadow-card">
            <p className="text-sm font-bold text-text">{r.name}</p>
            <p className="mt-0.5 text-xs leading-snug text-text-muted">{r.text}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {r.gold > 0 && <span className="inline-flex items-center gap-1 rounded-sm bg-background-alt px-2 py-1 text-xs font-semibold text-text"><Coins size={13} className="text-warning" aria-hidden />{r.gold}</span>}
              {r.xp > 0 && <span className="inline-flex items-center gap-1 rounded-sm bg-background-alt px-2 py-1 text-xs font-semibold text-text"><Star size={13} className="text-experience" aria-hidden />{r.xp} XP</span>}
              {r.items.map((i) => <ItemChip key={i.item} item={i.item} qty={i.qty} />)}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
