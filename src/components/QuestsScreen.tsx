import { useState } from 'react';
import { BookOpen, Check, Coins, Gift, Star } from 'lucide-react';
import type { GameState } from '@/types';
import { claimQuest, type ClaimReport } from '@/quests/claim';
import { QUEST_TYPE_LABEL } from '@/quests/definitions';
import { activeQuests, type QuestView } from '@/quests/engine';
import type { LevelUpInfo } from '@/progression/xp';
import { dismissTip } from '@/progression/actions';
import { ItemChip } from './AdventureBits';
import { TabLayout } from './TabLayout';
import { Button, EmptyState, ProgressBar, SegTabs, Tip } from './ui';
import type { UpdateGame } from './useGame';
import type { NavId } from '@/game/navigation';

interface Props {
  game: GameState;
  update: UpdateGame;
  variant: 'popup' | 'sidepanel';
  onNavigate: (id: NavId) => void;
  onLevelUp: (info: LevelUpInfo) => void;
  dots?: Partial<Record<NavId, boolean>>;
}

type Tab = 'today' | 'story' | 'explore';

function RewardLine({ view }: { view: QuestView }) {
  const r = view.def.reward;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {r.gold ? <span className="inline-flex items-center gap-1 rounded-sm bg-background-alt px-2 py-1 text-xs font-semibold text-text"><Coins size={13} className="text-warning" aria-hidden />{r.gold}</span> : null}
      {r.xp ? <span className="inline-flex items-center gap-1 rounded-sm bg-background-alt px-2 py-1 text-xs font-semibold text-text"><Star size={13} className="text-experience" aria-hidden />{r.xp} XP</span> : null}
      {r.items?.map((s) => <ItemChip key={s.item} item={s.item} qty={s.qty} />)}
      {r.flagText ? <span className="text-xs font-semibold text-primary-dark">{r.flagText.replace('The path to ', 'Opens ').replace(' is open.', '')}</span> : null}
    </div>
  );
}

function QuestCard({ view, onClaim }: { view: QuestView; onClaim: () => void }) {
  const story = view.def.type === 'story';
  return (
    <li className={`rounded-lg border bg-surface p-3.5 shadow-card ${view.claimed ? 'border-border opacity-60' : view.complete ? 'border-border-selected' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {story && <p className="mb-0.5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-primary-dark"><BookOpen size={12} aria-hidden />Story</p>}
          <h3 className="text-[15px] font-bold leading-tight text-text">{view.def.title}</h3>
        </div>
        {view.claimed && <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted"><Check size={14} aria-hidden />Done</span>}
      </div>
      <p className="mt-1 text-xs leading-snug text-text-muted">{view.def.description}</p>
      <ul className="mt-2.5 space-y-2">
        {view.objectives.map((o) => (
          <li key={o.label}>
            <div className="mb-1 flex items-baseline justify-between text-xs"><span className="font-semibold text-text">{o.label}</span><span className="tabular-nums text-text-muted">{o.value}/{o.target}</span></div>
            <ProgressBar value={o.value} max={o.target} label={o.label} />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-2">
        <RewardLine view={view} />
        {view.complete && !view.claimed && <Button className="shrink-0 px-3.5 py-2 text-[13px]" icon={Gift} onClick={onClaim}>Claim</Button>}
      </div>
    </li>
  );
}

export function QuestsScreen({ game, update, variant, onNavigate, onLevelUp, dots }: Props) {
  const [tab, setTab] = useState<Tab>('today');
  const [notice, setNotice] = useState<string | null>(null);
  const quests = activeQuests(game);
  const ready = (list: QuestView[]) => list.filter((q) => q.complete && !q.claimed).length || undefined;

  const groups = {
    today: quests.filter((q) => q.def.type === 'daily' || q.def.type === 'weekly'),
    story: quests.filter((q) => q.def.type === 'story'),
    explore: quests.filter((q) => q.def.type === 'exploration' || q.def.type === 'achievement'),
  };

  const claim = async (id: string) => {
    let report: ClaimReport | null = null;
    await update((s) => { const out = claimQuest(s, id, Date.now()); report = out.report; return out.state; });
    const r = report as ClaimReport | null;
    if (!r) return;
    setNotice(r.unlockedText ?? 'Reward claimed.');
    if (r.levelUp) onLevelUp(r.levelUp);
  };

  const section = (title: string, list: QuestView[]) => list.length > 0 && (
    <section key={title} aria-label={title} className="space-y-2">
      <h2 className="text-[13px] font-bold text-text">{title}</h2>
      <ul className="space-y-2">{list.map((q) => <QuestCard key={q.def.id} view={q} onClaim={() => void claim(q.def.id)} />)}</ul>
    </section>
  );

  return (
    <TabLayout variant={variant} active="quests" onNavigate={onNavigate} dots={dots}>
      <h1 className="text-xl font-bold text-text">Quests</h1>
      {!game.progress.tipsSeen.includes('quests') && (
        <Tip onDismiss={() => void update((s) => dismissTip(s, 'quests'))}>Quests track themselves as you play. Finish one, then claim the reward. Daily quests refresh every day.</Tip>
      )}
      <SegTabs label="Quest groups" value={tab} onChange={(t) => { setTab(t); setNotice(null); }} tabs={[
        { id: 'today', label: 'Daily & Weekly', badge: ready(groups.today) },
        { id: 'story', label: 'Story', badge: ready(groups.story) },
        { id: 'explore', label: 'Explore', badge: ready(groups.explore) },
      ]} />
      {notice && <p role="status" className="border-l-2 border-primary pl-2 text-xs font-semibold text-text">{notice}</p>}

      {tab === 'today' && (
        <>
          {section(QUEST_TYPE_LABEL.daily, groups.today.filter((q) => q.def.type === 'daily'))}
          {section(QUEST_TYPE_LABEL.weekly, groups.today.filter((q) => q.def.type === 'weekly'))}
          {groups.today.length === 0 && <EmptyState>No quests right now. Check back soon.</EmptyState>}
        </>
      )}
      {tab === 'story' && (groups.story.length ? section('Current chapter', groups.story) : <EmptyState>The story continues as you grow. For now, enjoy the journey.</EmptyState>)}
      {tab === 'explore' && (
        <>
          {section(QUEST_TYPE_LABEL.exploration, groups.explore.filter((q) => q.def.type === 'exploration'))}
          {section(QUEST_TYPE_LABEL.achievement, groups.explore.filter((q) => q.def.type === 'achievement'))}
          {groups.explore.length === 0 && <EmptyState>More to explore as your pet levels up.</EmptyState>}
        </>
      )}
    </TabLayout>
  );
}
