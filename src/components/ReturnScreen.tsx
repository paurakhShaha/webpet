import { useEffect, useRef, useState } from 'react';
import { Clock, Coins, Gift, Skull, Sparkles, Star, Swords, Trophy } from 'lucide-react';
import type { AdventureResult, Pet } from '@/types';
import { OUTCOME_TITLE, WELCOME_BACK, WHILE_AWAY, outcomeLine } from '@/adventure/copy';
import { getEnemy } from '@/adventure/enemies';
import { getItem } from '@/adventure/items';
import { getLocation } from '@/adventure/locations';
import { RARITY_SORT } from '@/adventure/config';
import { formatHm } from '@/utils/format';
import { getDiscovery, KIND_LABEL } from '@/world/discoveries';
import { SEASON_LABEL, TIME_LABEL, WEATHER_LABEL } from '@/world/clock';
import { ItemChip } from './AdventureBits';
import { locationIcon } from './icons';
import { PetSprite } from './PetSprite';
import { Button, Screen } from './ui';
import { useNow } from './useNow';

/** Counts up to a number so rewards feel earned. */
function CountUp({ to, ms = 700 }: { to: number; ms?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <span className="tabular-nums">{v.toLocaleString()}</span>;
}

type Row =
  | { kind: 'location' | 'duration' | 'enemies'; label: string; value: string; icon: typeof Clock }
  | { kind: 'xp' | 'gold'; label: string; value: number; icon: typeof Star }
  | { kind: 'item'; item: string; qty: number }
  | { kind: 'discovery'; id: string };

function buildRows(r: AdventureResult, now: number): Row[] {
  const loc = getLocation(r.locationId);
  const enemyBits = Object.entries(r.enemyCounts).sort(([, a], [, b]) => b - a).map(([id, n]) => `${getEnemy(id).name} ×${n}`);
  const rows: Row[] = [
    { kind: 'location', label: 'Location', value: loc.name, icon: locationIcon(loc.icon) },
    { kind: 'duration', label: 'Duration', value: `${formatHm(r.durationMs)} · away ${formatHm(Math.max(r.durationMs, now - r.startedAt))}`, icon: Clock },
    { kind: 'enemies', label: 'Enemies', value: `${r.enemiesDefeated}${enemyBits.length ? ` (${enemyBits.slice(0, 3).join(', ')}${enemyBits.length > 3 ? '…' : ''})` : ''}`, icon: Swords },
    { kind: 'xp', label: 'XP', value: r.xp, icon: Star },
    { kind: 'gold', label: 'Gold', value: r.gold, icon: Coins },
  ];
  for (const s of r.items) rows.push({ kind: 'item', item: s.item, qty: s.qty });
  for (const id of r.discoveries ?? []) if (getDiscovery(id)) rows.push({ kind: 'discovery', id });
  return rows;
}

const STEP_MS = 650;

/**
 * The homecoming: "Welcome back." → "While you were away…" → rewards appear one by one → collect.
 */
export function ReturnScreen({ pet, result, onCollect }: { pet: Pet; result: AdventureResult; onCollect: () => Promise<void> }) {
  const now = useNow(60_000);
  const rows = useRef(buildRows(result, Date.now())).current;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [stage, setStage] = useState<'welcome' | 'while' | 'rewards'>('welcome');
  const [shown, setShown] = useState(0);
  const [busy, setBusy] = useState(false);
  const done = shown >= rows.length;
  void now;

  useEffect(() => {
    if (stage === 'welcome') { const id = setTimeout(() => setStage('while'), reduced ? 200 : 1500); return () => clearTimeout(id); }
    if (stage === 'while') { const id = setTimeout(() => setStage('rewards'), reduced ? 200 : 1300); return () => clearTimeout(id); }
    if (shown < rows.length) { const id = setTimeout(() => setShown((n) => n + 1), reduced ? 60 : STEP_MS); return () => clearTimeout(id); }
  }, [stage, shown, rows.length, reduced]);

  const skip = () => { setStage('rewards'); setShown(rows.length); };
  const happy = result.outcome !== 'retreat';
  const OutcomeIcon = result.outcome === 'triumph' ? Trophy : result.outcome === 'success' ? Gift : Skull;

  if (stage !== 'rewards') {
    return (
      <Screen className="items-center justify-center gap-5 text-center">
        <PetSprite appearance={pet.appearance} element={pet.element} rarity={pet.rarity} scale={6} activity={{ animation: happy ? 'happy' : 'idle', key: 1 }} />
        <h1 key={stage} className="anim-rise text-[28px] font-bold text-text">{stage === 'welcome' ? WELCOME_BACK : WHILE_AWAY}</h1>
      </Screen>
    );
  }

  const itemRows = rows.filter((r) => r.kind === 'item');
  const discRows = rows.filter((r) => r.kind === 'discovery');
  const after = shown - 5 - itemRows.length;
  return (
    <Screen className="py-4">
      <div className="flex items-center gap-3">
        <PetSprite appearance={pet.appearance} element={pet.element} rarity={pet.rarity} scale={2} animated={false} />
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted"><OutcomeIcon size={14} className="text-primary-dark" aria-hidden />{OUTCOME_TITLE[result.outcome]}</p>
          <h1 className="text-[22px] font-bold leading-tight text-text">Adventure Complete</h1>
          {result.startWorld && <p className="text-[11px] text-text-muted">Set out in the {TIME_LABEL[result.startWorld.time].toLowerCase()} · {WEATHER_LABEL[result.startWorld.weather].toLowerCase()} · {SEASON_LABEL[result.startWorld.season].toLowerCase()}</p>}
        </div>
        {!done && <Button variant="ghost" onClick={skip} className="px-3 py-1.5 text-[13px]">Skip</Button>}
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {rows.slice(0, shown).map((row, i) => {
          if (row.kind === 'item' || row.kind === 'discovery') return null;
          const Icon = row.icon;
          return (
            <div key={i} className="anim-rise flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-card">
              <Icon size={18} className={row.kind === 'xp' ? 'text-experience' : row.kind === 'gold' ? 'text-warning' : 'text-primary-dark'} aria-hidden />
              <span className="w-[68px] shrink-0 text-xs font-semibold text-text-muted">{row.label}</span>
              <span className={`min-w-0 flex-1 text-right text-sm font-bold text-text ${row.kind === 'xp' || row.kind === 'gold' ? 'text-lg' : ''}`}>
                {row.kind === 'xp' || row.kind === 'gold' ? <>+<CountUp to={row.value} /></> : row.value}
              </span>
            </div>
          );
        })}

        {shown > 5 && (
          <div className="anim-rise rounded-lg border border-border bg-surface px-3.5 py-3 shadow-card">
            <p className="mb-2 text-xs font-semibold text-text-muted">Items</p>
            <div className="flex flex-wrap gap-1.5">
              {itemRows.slice(0, shown - 5).map((row) => row.kind === 'item' && (
                <span key={row.item} className="anim-rise relative">
                  <ItemChip item={row.item} qty={row.qty} className="py-1.5 text-[13px]" />
                  {RARITY_SORT[getItem(row.item).rarity] >= 2 && <span aria-hidden className="anim-twinkle absolute -right-1 -top-1 size-2 rounded-[2px] bg-accent-yellow" />}
                </span>
              ))}
            </div>
          </div>
        )}
        {shown === 5 && itemRows.length === 0 && discRows.length === 0 && <p className="px-1 text-xs text-text-muted">No materials this time.</p>}
        {after > 0 && (
          <div className="anim-rise space-y-2 rounded-lg border-2 border-border-selected bg-surface px-3.5 py-3 shadow-card">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark"><Sparkles size={14} aria-hidden />Discoveries</p>
            {discRows.slice(0, after).map((row) => { if (row.kind !== 'discovery') return null; const d = getDiscovery(row.id)!; return (
              <div key={row.id} className="anim-rise"><p className="text-sm font-bold text-text">{d.name} <span className="text-xs font-semibold text-text-muted">· {KIND_LABEL[d.kind]}</span></p><p className="text-xs leading-snug text-text-muted">{d.text.replace('{name}', pet.name)}</p></div>
            ); })}
          </div>
        )}
        {done && <p className="anim-rise px-1 text-center text-xs text-text-muted">{outcomeLine(result.outcome, pet.name)}</p>}
      </div>

      <div className="pb-4 pt-3">
        <Button icon={Gift} className="w-full" disabled={!done || busy} onClick={() => { setBusy(true); void onCollect(); }}>Collect Rewards</Button>
      </div>
    </Screen>
  );
}
