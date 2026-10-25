import { useState } from 'react';
import { ArrowLeft, ChevronRight, Check, Circle, Lock, Moon } from 'lucide-react';
import type { GameState, LocationDefinition, WorldNow } from '@/types';
import { ENEMIES } from '@/adventure/enemies';
import { activeQuests } from '@/quests/engine';
import { DISCOVERIES } from '@/world/discoveries';
import { npcsInRegion } from '@/world/npcs';
import { locationVisible, locationsOf, regionRank, regionStatus, type RegionDefinition } from '@/world/regions';
import type { WorldEventInstance } from '@/world/events';
import type { LevelUpInfo } from '@/progression/xp';
import type { ShopSection } from '@/shop/listings';
import type { NavId } from '@/game/navigation';
import { NPC_PORTRAITS } from '@/pixel/npcs';
import { DifficultyPips, ItemChip, RiskTag } from './AdventureBits';
import { enemyIcon, locationIcon } from './icons';
import { Happenings } from './Happenings';
import { NpcPanel } from './NpcPanel';
import { PixelCanvas } from './PixelCanvas';
import { Button, ProgressBar } from './ui';
import type { UpdateGame } from './useGame';
import { WorldChips } from './WorldBits';
import { regionIcon } from './worldIcons';

interface Props {
  game: GameState;
  update: UpdateGame;
  region: RegionDefinition;
  world: WorldNow;
  events: WorldEventInstance[];
  now: number;
  onBack: () => void;
  onChoose: (loc: LocationDefinition) => void;
  onLevelUp: (info: LevelUpInfo) => void;
  onOpenShop: (section: ShopSection) => void;
  onNavigate: (id: NavId) => void;
}

const counter = (g: GameState, m: string) => g.progress.counters[m] ?? 0;

/** A single "unknown" placeholder, so players can tell there is more without being told what. */
const Unknown = ({ n = 1 }: { n?: number }) => (
  <>{Array.from({ length: n }, (_, i) => <span key={i} className="inline-flex items-center rounded-sm bg-background-alt px-2 py-1 text-xs font-bold text-text-disabled" aria-label="Not found yet">???</span>)}</>
);

export function RegionView({ game, update, region, world, events, now, onBack, onChoose, onLevelUp, onOpenShop, onNavigate }: Props) {
  const [npcId, setNpcId] = useState<string | null>(null);
  const st = regionStatus(game, region);
  const Icon = regionIcon(region.icon);
  const places = locationsOf(region.id);
  const visible = places.filter((l) => locationVisible(game, l));
  const hiddenLeft = places.some((l) => l.hidden && !locationVisible(game, l));
  const npcs = npcsInRegion(game, region.id, world);
  const npc = npcs.find((n) => n.id === npcId);
  const rank = regionRank(game, region.id);
  const here = events.filter((e) => e.region === region.id);
  const pet = game.pet!;

  if (npc) return <NpcPanel game={game} update={update} npc={npc} world={world} onBack={() => setNpcId(null)} onOpenShop={onOpenShop} onNavigate={onNavigate} />;

  // What the pet has actually met and collected here. Everything else stays a question mark.
  const enemyIds = [...new Set(visible.flatMap((l) => l.enemyTypes.map((e) => e.enemy)))];
  const metEnemies = enemyIds.filter((id) => counter(game, `defeated:${id}`) > 0);
  const drops = [...new Set(visible.flatMap((l) => l.rewardTable.drops.filter((d) => !d.season).map((d) => d.item)))];
  const treasure = [...new Set(visible.flatMap((l) => l.rewardTable.treasure.map((d) => d.item)))];
  const foundDiscoveries = DISCOVERIES.filter((d) => d.regions.includes(region.id) && d.unique && game.progress.flags.includes(`disc:${d.id}`));
  const quests = activeQuests(game).filter((q) => !q.claimed && q.def.objectives.some((o) => visible.some((l) => o.metric.includes(l.id))));

  return (
    <>
      <Button variant="ghost" icon={ArrowLeft} onClick={onBack} className="self-start px-3 py-1.5">World map</Button>

      <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-card">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 22%, transparent), transparent 70%)` }} />
        <div className="relative flex items-start gap-3">
          <span className={`grid size-12 shrink-0 place-items-center rounded-lg border-2 shadow-card ${st.open ? 'border-border-selected bg-surface text-primary-dark' : 'border-dashed border-border-hover bg-background-alt text-text-disabled'}`}>
            {st.open ? <Icon size={24} aria-hidden /> : <Lock size={20} aria-hidden />}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight text-text">{region.name}</h1>
            <p className="mt-0.5 text-xs leading-snug text-text-muted">{region.description}</p>
          </div>
        </div>
        <WorldChips world={world} className="relative mt-3" />
      </div>

      {!st.open ? (
        <section aria-label="How to open this place" className="rounded-lg border border-border bg-surface p-4 shadow-card">
          <h2 className="mb-2 text-[13px] font-bold text-text">Not open yet</h2>
          <ul className="space-y-2">
            {st.requirements.map((q) => (
              <li key={q.label} className="flex items-start gap-2 text-sm">
                {q.met ? <Check size={16} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden /> : <Circle size={16} className="mt-0.5 shrink-0 text-text-disabled" aria-hidden />}
                <span className={q.met ? 'text-text-muted line-through' : 'text-text'}>{q.label}{q.target && !q.met ? ` (${q.current ?? 0}/${q.target})` : ''}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3"><ProgressBar value={st.progress} max={1} label="Progress toward opening" color="var(--color-warning)" /></div>
          <p className="mt-2 text-xs text-text-muted">{pet.name} is level {pet.level}.</p>
        </section>
      ) : (
        <>
          {places.length > 0 && (
            <section aria-label="Progress in this region" className="rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[13px] font-bold text-text">{rank.rank}</span>
                <span className="text-xs text-text-muted">{rank.trips} {rank.trips === 1 ? 'trip' : 'trips'}{rank.next ? ` · ${rank.next.label} at ${rank.next.at}` : ' · Top rank'}</span>
              </div>
              <ProgressBar value={rank.progress} max={1} label="Region rank" />
            </section>
          )}

          {npcs.length > 0 && (
            <section aria-label="People here" className="space-y-2">
              <h2 className="text-[13px] font-bold text-text">Who&rsquo;s here</h2>
              <ul className="grid grid-cols-2 gap-2">
                {npcs.map((n) => (
                  <li key={n.id}>
                    <button onClick={() => setNpcId(n.id)} className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface p-2.5 text-left shadow-card transition hover:border-border-hover hover:bg-surface-hover">
                      <PixelCanvas grid={NPC_PORTRAITS[n.id]} scale={3} label="" />
                      <span className="min-w-0"><span className="block truncate text-[13px] font-bold text-text">{n.name}</span><span className="block truncate text-[11px] text-text-muted">{n.role}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {places.length > 0 ? (
            <section aria-label="Places" className="space-y-2">
              <h2 className="text-[13px] font-bold text-text">Places to explore</h2>
              <ul className="space-y-2">
                {visible.map((loc) => {
                  const LIcon = locationIcon(loc.icon);
                  const low = pet.level < loc.minimumLevel;
                  return (
                    <li key={loc.id}>
                      <button onClick={() => onChoose(loc)} disabled={low} className="group flex w-full items-start gap-3 rounded-lg border border-border bg-surface p-3 text-left shadow-card transition hover:border-border-hover hover:bg-surface-hover disabled:cursor-not-allowed disabled:bg-background-alt disabled:shadow-none">
                        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-background-alt text-primary-dark">{low ? <Lock size={17} aria-hidden /> : <LIcon size={19} aria-hidden />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2"><span className="text-[15px] font-bold text-text">{loc.name}</span>{!low && <ChevronRight size={16} className="text-text-muted transition group-hover:translate-x-0.5" aria-hidden />}</span>
                          {loc.hidden && <span className="text-[11px] font-bold text-primary-dark">Hidden place, discovered</span>}
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-text-muted">{loc.description}</span>
                          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1"><DifficultyPips difficulty={loc.difficulty} /><RiskTag risk={loc.riskLevel} /><span className="text-xs font-semibold text-text-muted">{low ? `Unlocks at level ${loc.minimumLevel}` : `Level ${loc.minimumLevel}+`}</span></span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {hiddenLeft && <p className="px-1 text-xs italic text-text-muted">Some places only reveal themselves to the patient.</p>}
            </section>
          ) : (
            <p className="rounded-lg border border-dashed border-border-hover px-4 py-4 text-center text-sm text-text-muted">{region.lore} A safe place to rest. No adventures here, but plenty of friends.</p>
          )}

          {places.length > 0 && (
            <section aria-label="What lives here" className="space-y-1.5">
              <h2 className="text-[13px] font-bold text-text">What lives here</h2>
              <div className="flex flex-wrap gap-1.5">
                {metEnemies.map((id) => {
                  const e = ENEMIES[id]; const EIcon = enemyIcon(e.icon);
                  const night = visible.some((l) => l.enemyTypes.some((t) => t.enemy === id && t.time?.includes('night')) && !l.enemyTypes.some((t) => t.enemy === id && !t.time));
                  return <span key={id} title={e.description} className="inline-flex items-center gap-1.5 rounded-sm bg-background-alt px-2 py-1 text-xs font-medium text-text"><EIcon size={13} className="text-text-muted" aria-hidden />{e.name}{night && <Moon size={11} className="text-text-muted" aria-label="Comes out at night" />}</span>;
                })}
                <Unknown n={Math.min(3, enemyIds.length - metEnemies.length)} />
              </div>
              <h2 className="pt-1.5 text-[13px] font-bold text-text">Resources &amp; special finds</h2>
              <div className="flex flex-wrap gap-1.5">
                {[...drops, ...treasure].filter((i) => counter(game, `collected:${i}`) > 0).map((i) => <ItemChip key={i} item={i} />)}
                <Unknown n={Math.min(4, [...drops, ...treasure].filter((i) => counter(game, `collected:${i}`) === 0).length)} />
              </div>
              {foundDiscoveries.length > 0 && (
                <>
                  <h2 className="pt-1.5 text-[13px] font-bold text-text">Discoveries here</h2>
                  <p className="text-xs text-text-muted">{foundDiscoveries.map((d) => d.name).join(' · ')}. There may be more.</p>
                </>
              )}
            </section>
          )}

          {quests.length > 0 && (
            <section aria-label="Related quests" className="space-y-1.5">
              <h2 className="text-[13px] font-bold text-text">Quests here</h2>
              <ul className="space-y-1">{quests.map((q) => <li key={q.def.id}><button onClick={() => onNavigate('quests')} className="w-full rounded-md bg-background-alt px-3 py-2 text-left text-xs font-semibold text-text hover:bg-surface-active">{q.def.title} <span className="font-normal text-text-muted">· {q.objectives.map((o) => `${o.value}/${o.target}`).join(', ')}</span></button></li>)}</ul>
            </section>
          )}

          <Happenings game={game} update={update} events={here} now={now} onLevelUp={onLevelUp} inRegion />
        </>
      )}
    </>
  );
}
