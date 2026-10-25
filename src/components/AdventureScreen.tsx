import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Backpack, Clock, Coins, Footprints, History, Play, Zap } from 'lucide-react';
import { listInventory } from '@/inventory/service';
import { describeEffect } from '@/inventory/describe';
import type { DurationId, GameState, LocationDefinition } from '@/types';
import {
  DURATIONS, checkStart, conditionOf, estimateOutlook, expectedRewardNames, getDuration, getEnemy,
  getLocation, startAdventure, startBlockMessage,
} from '@/adventure';
import { OUTCOME_TITLE, OUTLOOK_COPY } from '@/adventure/copy';
import { scheduleAdventureAlarm } from '@/adventure/extension';
import { combatStats, COMBAT_STAT_KEYS, COMBAT_STAT_LABELS } from '@/adventure/stats';
import { formatClock, formatCountdown, formatDay, formatHm } from '@/utils/format';
import { uuid } from '@/utils/id';
import { DifficultyPips, ItemChip, RiskTag } from './AdventureBits';
import { Header } from './Header';
import { enemyIcon, locationIcon } from './icons';
import { NavBar } from './NavBar';
import { worldNotes } from './worldNote';
import { Button, GoldPill, ProgressBar, Screen, Stage } from './ui';
import type { UpdateGame } from './useGame';
import { useLivePet } from './useLivePet';
import { useNow } from './useNow';
import type { NavId } from '@/game/navigation';
import type { LevelUpInfo } from '@/progression/xp';
import type { ShopSection } from '@/shop/listings';
import { currentWorld } from '@/world';
import { activeEvents } from '@/world/events';
import { getRegion, regionStatus, type RegionDefinition } from '@/world/regions';
import { Happenings } from './Happenings';
import { RegionView } from './RegionView';
import { WorldChips } from './WorldBits';
import { WorldMap } from './WorldMap';

interface Props {
  game: GameState;
  update: UpdateGame;
  variant: 'popup' | 'sidepanel';
  onNavigate: (id: NavId) => void;
  dots?: Partial<Record<NavId, boolean>>;
  onLevelUp: (info: LevelUpInfo) => void;
  onOpenShop: (section: ShopSection) => void;
}

type View = 'map' | 'region' | 'preview' | 'history';

export function AdventureScreen({ game, update, variant, onNavigate, dots, onLevelUp, onOpenShop }: Props) {
  const now = useNow(1000);
  const pet = useLivePet(game.pet, now)!;
  const [view, setView] = useState<View>('map');
  const [selected, setSelected] = useState<LocationDefinition | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const minute = Math.floor(now / 60_000);
  const world = useMemo(() => currentWorld(game, now), [game.world, minute]); // eslint-disable-line react-hooks/exhaustive-deps
  const events = useMemo(() => activeEvents(game, now), [game.pet?.level, game.progress.flags, game.world, minute]); // eslint-disable-line react-hooks/exhaustive-deps
  const region = regionId ? getRegion(regionId) ?? null : null;

  // Looking at a newly opened region counts as having seen it (so its "New" tag goes away).
  useEffect(() => {
    if (region && regionStatus(game, region).open && !game.world.regionsSeen.includes(region.id)) {
      void update((st) => ({ ...st, world: { ...st.world, regionsSeen: [...st.world.regionsSeen, region.id] } }));
    }
  }, [region?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openRegion = (r: RegionDefinition) => { setRegionId(r.id); setView('region'); };
  const [durationId, setDurationId] = useState<DurationId>('1h');
  const [error, setError] = useState<string | null>(null);
  const active = game.adventure.active;

  const choose = (loc: LocationDefinition) => {
    setSelected(loc);
    setDurationId(loc.durationOptions.includes('1h') ? '1h' : loc.durationOptions[0]);
    setError(null);
    setView('preview');
  };

  const start = async () => {
    if (!selected) return;
    const seed = uuid();
    let message: string | null = null;
    let when = 0;
    await update((s) => {
      const res = startAdventure(s, { locationId: selected.id, durationId, seed }, Date.now());
      if (!res.ok) { message = res.message; return s; }
      when = res.state.adventure.active!.expectedCompletion;
      return res.state;
    });
    if (message) setError(message);
    else { scheduleAdventureAlarm(when); setView('map'); setRegionId(null); }
  };

  return (
    <Screen>
      <Header variant={variant} />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
        {active ? (
          <AwayView game={game} now={now} />
        ) : view === 'preview' && selected ? (
          <PreviewView game={game} pet={pet} loc={selected} durationId={durationId} onDuration={setDurationId} onBack={() => setView(region ? 'region' : 'map')} onStart={() => void start()} error={error} world={world} />
        ) : view === 'history' ? (
          <HistoryView game={game} now={now} onBack={() => setView('map')} />
        ) : view === 'region' && region ? (
          <RegionView game={game} update={update} region={region} world={world} events={events} now={now} onBack={() => { setView('map'); setRegionId(null); }}
            onChoose={choose} onLevelUp={onLevelUp} onOpenShop={onOpenShop} onNavigate={onNavigate} />
        ) : (
          <WorldView game={game} pet={pet} world={world} events={events} now={now} update={update} onOpen={openRegion} onHistory={() => setView('history')} onLevelUp={onLevelUp} />
        )}
      </div>
      <NavBar active="adventure" onNavigate={onNavigate} dots={{ adventure: !!active, ...dots }} />
    </Screen>
  );
}

// ── Map ──────────────────────────────────────────────────────

function WorldView({ game, pet, world, events, now, update, onOpen, onHistory, onLevelUp }: {
  game: GameState; pet: NonNullable<GameState['pet']>; world: ReturnType<typeof currentWorld>; events: ReturnType<typeof activeEvents>; now: number;
  update: UpdateGame; onOpen: (r: RegionDefinition) => void; onHistory: () => void; onLevelUp: (info: LevelUpInfo) => void;
}) {
  const cond = conditionOf(pet);
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">The World</h1>
        <div className="flex items-center gap-1.5">
          <GoldPill gold={game.inventory.gold} />
          <button onClick={onHistory} aria-label="Adventure history" title="History" className="rounded-md p-2 text-text-muted transition hover:bg-surface-active hover:text-text">
            <History size={18} aria-hidden />
          </button>
        </div>
      </div>
      <WorldChips world={world} />

      <WorldMap game={game} world={world} events={events} onOpen={onOpen} />
      <p className="px-1 text-center text-xs text-text-muted">Tap a place to look around. New places open as {pet.name} grows and discovers things.</p>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-background-alt px-3.5 py-2.5 text-xs text-text-muted">
        <span className="font-semibold text-text">{pet.name}</span>
        <span>Level {pet.level}</span>
        <span className="inline-flex items-center gap-1"><Zap size={13} className="text-energy" aria-hidden />{Math.round(pet.energy)}</span>
        <span className="ml-auto">Condition: <span className="font-semibold text-text">{cond.label}</span></span>
      </div>
      {cond.tips[0] && <p className="-mt-1 px-1 text-xs text-text-muted">{cond.tips[0]}</p>}
      {game.pet?.sleep && <p className="-mt-1 px-1 text-xs text-text-muted">{pet.name} is asleep. Wake them before sending them out.</p>}

      <Happenings game={game} update={update} events={events} now={now} onLevelUp={onLevelUp} />
    </>
  );
}

// ── Preview ──────────────────────────────────────────────────

function PreviewView(props: {
  game: GameState; pet: NonNullable<GameState['pet']>; loc: LocationDefinition; durationId: DurationId;
  onDuration: (d: DurationId) => void; onBack: () => void; onStart: () => void; error: string | null; world: ReturnType<typeof currentWorld>;
}) {
  const { game, pet, loc, durationId, onDuration, onBack, onStart, error, world } = props;
  const Icon = locationIcon(loc.icon);
  const block = checkStart(pet, game, loc, durationId);
  const cost = getDuration(durationId).energy;
  const outlook = useMemo(() => estimateOutlook(pet, loc, durationId), [pet.level, world.time, pet.hunger >= 60, pet.happiness >= 70, Math.round(pet.hunger / 10), Math.round(pet.happiness / 10), pet.id, loc.id, durationId]); // eslint-disable-line react-hooks/exhaustive-deps
  const copy = OUTLOOK_COPY[outlook.outlook];
  const stats = combatStats(pet);
  const drops = loc.rewardTable.drops.map((d) => d.item);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack} className="px-3 py-1.5">Back</Button>
        <WorldChips world={world} className="ml-auto" />
      </div>

      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-md border border-border-selected bg-surface text-primary-dark shadow-card"><Icon size={24} aria-hidden /></span>
        <div>
          <h1 className="text-xl font-bold leading-tight text-text">{loc.name}</h1>
          <p className="mt-0.5 text-xs leading-snug text-text-muted">{loc.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm shadow-card">
        <span className="text-text-muted">Difficulty</span><DifficultyPips difficulty={loc.difficulty} />
        <span className="text-text-muted">Risk</span><RiskTag risk={loc.riskLevel} />
        <span className="text-text-muted">Duration</span><span className="font-semibold text-text">{getDuration(durationId).label}</span>
        <span className="text-text-muted">Energy</span><span className="inline-flex items-center gap-1 font-semibold text-text"><Zap size={14} className="text-energy" aria-hidden />{cost} <span className="font-normal text-text-muted">of {Math.round(pet.energy)}</span></span>
      </div>

      <section aria-label="Trip length">
        <h2 className="mb-1.5 text-[13px] font-bold text-text">How long?</h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Duration">
          {DURATIONS.map((d) => {
            const offered = loc.durationOptions.includes(d.id);
            const tooTired = offered && pet.energy < d.energy;
            const on = d.id === durationId;
            return (
              <button
                key={d.id}
                role="radio"
                aria-checked={on}
                disabled={!offered || tooTired}
                onClick={() => onDuration(d.id)}
                title={!offered ? 'Not available here' : tooTired ? 'Too tired for this trip' : undefined}
                className={`flex flex-col items-center rounded-md border px-2 py-2 transition disabled:cursor-not-allowed disabled:bg-background-alt disabled:text-text-disabled ${
                  on ? 'border-border-selected bg-primary/15 text-text' : 'border-border bg-surface text-text hover:border-border-hover hover:bg-surface-hover'
                }`}
              >
                <span className="text-[13px] font-bold">{d.short}</span>
                <span className="inline-flex items-center gap-0.5 text-[11px] text-text-muted"><Zap size={10} aria-hidden />{d.energy}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
        <p className="text-sm font-bold text-text">{copy.label}</p>
        <p className="text-xs text-text-muted">{copy.text}</p>
        <p className="mt-1 text-xs text-text-muted">{pet.name} · Level {pet.level} · {COMBAT_STAT_KEYS.map((k) => `${COMBAT_STAT_LABELS[k]} ${stats[k]}`).join(' · ')}</p>
      </div>

      {pet.boosts.length > 0 && <p className="text-xs font-semibold text-text">Boost ready: {pet.boosts.map((b) => describeEffect({ kind: 'stat', stat: b.stat, amount: b.amount })).join(', ')}</p>}

      {worldNotes(loc, world).map((n) => <p key={n} className="text-xs italic text-text-muted">{n}</p>)}

      <section aria-label="Expected rewards">
        <h2 className="mb-1.5 text-[13px] font-bold text-text">Expected rewards: <span className="font-semibold text-text-muted">{expectedRewardNames(loc).join(', ')}</span></h2>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1 text-xs font-semibold text-text"><Coins size={14} className="text-warning" aria-hidden />Gold</span>
          {drops.map((id) => <ItemChip key={id} item={id} />)}
          {loc.rewardTable.treasure.map((t) => <ItemChip key={t.item} item={t.item} className="opacity-80" />)}
        </div>
        <p className="mt-1.5 text-xs text-text-muted">Rarer finds are possible, especially on longer trips.</p>
      </section>

      <section aria-label="Enemies">
        <h2 className="mb-1.5 text-[13px] font-bold text-text">You may meet</h2>
        <div className="flex flex-wrap gap-1.5">
          {loc.enemyTypes.map(({ enemy }) => {
            const e = getEnemy(enemy);
            const EIcon = enemyIcon(e.icon);
            return <span key={enemy} title={e.description} className="inline-flex items-center gap-1.5 rounded-sm bg-background-alt px-2 py-1 text-xs font-medium text-text"><EIcon size={13} className="text-text-muted" aria-hidden />{e.name}</span>;
          })}
        </div>
      </section>

      {conditionOf(pet).tips.map((t) => <p key={t} className="text-xs text-text-muted">{t}</p>)}
      {(error || block) && <p className="border-l-2 border-warning pl-2 text-xs font-semibold text-text">{error ?? startBlockMessage(block!)}</p>}
      <Button icon={Play} onClick={onStart} disabled={!!block} className="sticky bottom-0 w-full">Start Adventure</Button>
    </>
  );
}

// ── While away ───────────────────────────────────────────────

function AwayView({ game, now }: { game: GameState; now: number }) {
  const a = game.adventure.active!;
  const loc = getLocation(a.locationId);
  const Icon = locationIcon(loc.icon);
  const remaining = a.expectedCompletion - now;
  return (
    <>
      <h1 className="text-xl font-bold text-text">{game.pet?.name} is out exploring</h1>
      <Stage className="h-[190px] shrink-0">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="grid size-14 place-items-center rounded-md border border-border-selected bg-background text-primary-dark"><Icon size={28} aria-hidden /></span>
          <p className="text-[15px] font-bold text-text">{loc.name}</p>
          <p className="inline-flex items-center gap-1.5 text-xs text-text-muted"><Footprints size={14} aria-hidden />On the trail</p>
        </div>
      </Stage>
      <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-text"><Clock size={15} className="text-primary-dark" aria-hidden />Back in {remaining > 0 ? formatCountdown(remaining) : 'a moment'}</span>
          <span className="text-xs text-text-muted">around {formatClock(a.expectedCompletion)}</span>
        </div>
        <ProgressBar value={Math.min(a.durationMs, now - a.startedAt)} max={a.durationMs} label="Adventure progress" />
        <p className="mt-2 text-xs text-text-muted">{getDuration(a.durationId).label} trip · you can close the browser. {game.pet?.name} keeps going, and you will hear about it when they’re home.</p>
      </div>
    </>
  );
}

// ── History ──────────────────────────────────────────────────

function HistoryView({ game, now, onBack }: { game: GameState; now: number; onBack: () => void }) {
  const adv = game.adventure;
  const owned = listInventory(game, 'material');
  return (
    <>
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack} className="px-3 py-1.5">Map</Button>
        <GoldPill gold={game.inventory.gold} />
      </div>
      <h1 className="text-xl font-bold text-text">Adventure history</h1>

      <section aria-label="Collection" className="rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
        <h2 className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-text"><Backpack size={15} className="text-primary-dark" aria-hidden />Collection</h2>
        {owned.length === 0 ? (
          <p className="text-xs text-text-muted">Nothing yet. Materials from your adventures will collect here (see the Inventory tab).</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">{owned.map((it) => <ItemChip key={it.id} item={it.id} qty={it.quantity} />)}</div>
        )}
      </section>

      {adv.history.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-hover px-4 py-6 text-center text-sm text-text-muted">No adventures yet. Pick a place on the map to send {game.pet?.name} out.</p>
      ) : (
        <ul className="space-y-2">
          {adv.history.map((r) => {
            const loc = getLocation(r.locationId);
            const Icon = locationIcon(loc.icon);
            return (
              <li key={r.id} className="flex gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-background-alt text-primary-dark"><Icon size={18} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold text-text">{loc.name}</span>
                    <span className="shrink-0 text-[11px] text-text-muted">{formatDay(r.completedAt, now)}</span>
                  </div>
                  <p className="text-xs text-text-muted">{OUTCOME_TITLE[r.outcome]} · {formatHm(r.completedAt - r.startedAt)} · {r.enemies} enemies</p>
                  <p className="mt-0.5 text-xs font-semibold text-text">
                    +{r.xp} XP · +{r.gold} gold{r.items.length ? ` · ${r.items.reduce((n, i) => n + i.qty, 0)} items` : ''}{r.levelsGained ? ' · Level up' : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
