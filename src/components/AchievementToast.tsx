import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import type { GameState } from '@/types';
import { getAchievement } from '@/achievements';

/** A small, quiet banner when an achievement is earned. Shown once per achievement per visit. */
export function AchievementToast({ game }: { game: GameState }) {
  const [shown, setShown] = useState<string[]>([]);
  const next = game.progress.unseenAchievements.find((id) => !shown.includes(id));

  useEffect(() => {
    if (!next) return;
    const id = setTimeout(() => setShown((s) => [...s, next]), 4500);
    return () => clearTimeout(id);
  }, [next]);

  const def = next ? getAchievement(next) : null;
  if (!def) return null;
  return (
    <div role="status" className="anim-rise pointer-events-none absolute inset-x-4 top-3 z-50 flex items-center gap-2.5 rounded-lg border border-border-selected bg-surface px-3.5 py-2.5 shadow-raised">
      <Trophy size={18} className="shrink-0 text-warning" aria-hidden />
      <p className="text-[13px] text-text"><span className="font-bold">Achievement unlocked</span> · {def.name}</p>
    </div>
  );
}
