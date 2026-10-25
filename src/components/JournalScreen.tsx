import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Compass, Lock, Sparkles, Star, Trophy, Heart, Gem } from 'lucide-react';
import type { GameState, JournalSection } from '@/types';
import { ACHIEVEMENTS } from '@/achievements';
import { friendshipLevel } from '@/game/friendship';
import { nextUnlocks } from '@/progression/unlocks';
import { markAchievementsSeen } from '@/progression/actions';
import { SECTION_LABEL, formatJournalDate } from '@/journal/journal';
import { formatDay } from '@/utils/format';
import { achievementIcon } from './icons';
import { TabLayout } from './TabLayout';
import { EmptyState, SegTabs } from './ui';
import type { UpdateGame } from './useGame';
import type { NavId } from '@/game/navigation';

interface Props {
  game: GameState;
  update: UpdateGame;
  variant: 'popup' | 'sidepanel';
  onNavigate: (id: NavId) => void;
  dots?: Partial<Record<NavId, boolean>>;
}

const TABS: { id: JournalSection; label: string }[] = [
  { id: 'memories', label: 'Memories' },
  { id: 'discoveries', label: 'Finds' },
  { id: 'adventures', label: 'Trips' },
  { id: 'events', label: 'Events' },
  { id: 'milestones', label: 'Pet' },
];

const ICON: Record<JournalSection, typeof Star> = { memories: Heart, discoveries: Gem, adventures: Compass, events: Sparkles, milestones: Star };
const EMPTY: Record<JournalSection, string> = {
  memories: 'Special moments will be remembered here: first finds, first nights out, first rainy days.',
  discoveries: 'Hidden places, rare plants and new friends will be written down here as your pet finds them.',
  adventures: 'Every trip is noted here, so you can look back on where your pet has been.',
  events: 'Story chapters, new places opening and things that happen in the world appear here.',
  milestones: 'Hatching, level-ups and friendships are kept here.',
};

const STATS: { metric: string; label: string }[] = [
  { metric: 'adventures', label: 'Adventures completed' },
  { metric: 'enemies', label: 'Enemies defeated' },
  { metric: 'discoveries', label: 'Discoveries made' },
  { metric: 'treasures', label: 'Rare treasures found' },
  { metric: 'care', label: 'Times cared for' },
  { metric: 'gold-earned', label: 'Gold earned' },
];

export function JournalScreen({ game, update, variant, onNavigate, dots }: Props) {
  const [tab, setTab] = useState<JournalSection>('memories');
  const pet = game.pet!;
  const earned = game.progress.achievements;
  const fresh = new Set(game.progress.unseenAchievements);
  const count = ACHIEVEMENTS.filter((a) => earned[a.id]).length;

  // Looking at the journal counts as seeing new achievements (the badge stays visible on this visit).
  useEffect(() => () => { void update(markAchievementsSeen); }, [update]);

  const entries = useMemo(() => game.journal.entries.filter((e) => e.section === tab).sort((a, b) => b.at - a.at), [game.journal.entries, tab]);
  const days = useMemo(() => {
    const out: { date: string; items: typeof entries }[] = [];
    for (const e of entries) {
      const date = formatJournalDate(e.at);
      const last = out[out.length - 1];
      if (last && last.date === date) last.items.push(e); else out.push({ date, items: [e] });
    }
    return out;
  }, [entries]);
  const Icon = ICON[tab];

  return (
    <TabLayout variant={variant} active="journal" onNavigate={onNavigate} dots={dots}>
      <div className="flex items-baseline justify-between">
        <h1 className="inline-flex items-center gap-2 text-xl font-bold text-text"><BookOpen size={20} className="text-primary-dark" aria-hidden />Journal</h1>
        <span className="text-xs font-semibold text-text-muted">{game.journal.entries.length} notes</span>
      </div>
      <SegTabs label="Journal sections" value={tab} onChange={setTab} tabs={TABS} />
      <h2 className="text-[13px] font-bold text-text">{SECTION_LABEL[tab]}</h2>

      {days.length === 0 ? <EmptyState>{EMPTY[tab]}</EmptyState> : (
        <ol className="space-y-3">
          {days.map((d) => (
            <li key={d.date}>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">{d.date}</p>
              <ul className="space-y-1.5">
                {d.items.map((e) => (
                  <li key={e.id} className="flex gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card">
                    <Icon size={15} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden />
                    <p className="text-[13px] leading-snug text-text"><span className="font-bold">{e.title}.</span> <span className="text-text-muted">{e.text}</span></p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {tab === 'milestones' && (
        <>
          <section aria-label="Achievements" className="space-y-2">
            <h2 className="inline-flex items-center gap-1.5 text-[13px] font-bold text-text"><Trophy size={14} className="text-warning" aria-hidden />Achievements <span className="font-normal text-text-muted">{count} of {ACHIEVEMENTS.length}</span></h2>
            <ul className="grid grid-cols-2 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const at = earned[a.id];
                const AIcon = achievementIcon(a.icon);
                return (
                  <li key={a.id} className={`relative flex gap-2.5 rounded-lg border bg-surface p-3 shadow-card ${at ? 'border-border-selected' : 'border-border opacity-70'}`}>
                    <span className={`grid size-9 shrink-0 place-items-center rounded-md ${at ? 'bg-primary/20 text-primary-dark' : 'bg-background-alt text-text-disabled'}`}>{at ? <AIcon size={18} aria-hidden /> : <Lock size={16} aria-hidden />}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold leading-tight text-text">{a.name}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{a.description}</p>
                      {at && <p className="mt-1 text-[10px] font-semibold text-text-muted">{formatDay(at)}</p>}
                    </div>
                    {at && fresh.has(a.id) && <span className="absolute right-2 top-2 rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-text-on-secondary">New</span>}
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
            <h2 className="mb-2 text-[13px] font-bold text-text">Your journey so far</h2>
            <p className="mb-2 text-sm text-text">{pet.name} · Level {pet.level} · {friendshipLevel(pet.friendship)}</p>
            <ul className="space-y-1.5">
              {STATS.map((s) => <li key={s.metric} className="flex items-baseline justify-between text-sm"><span className="text-text-muted">{s.label}</span><span className="font-bold tabular-nums text-text">{(game.progress.counters[s.metric] ?? 0).toLocaleString()}</span></li>)}
            </ul>
          </section>
          <section className="rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
            <h2 className="mb-2 text-[13px] font-bold text-text">Coming up</h2>
            <ul className="space-y-2">
              {nextUnlocks(pet.level, 4).map((n) => <li key={n.level} className="text-sm"><span className="font-bold text-text">Level {n.level}</span><span className="text-text-muted"> — {n.unlocks.map((u) => u.label).join(', ')}</span></li>)}
            </ul>
          </section>
        </>
      )}
    </TabLayout>
  );
}
