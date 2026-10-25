import { Clock, X } from 'lucide-react';
import type { AwaySummary } from '@/types';
import { awayLines } from '@/dialogue';

export function AwayCard({ summary, name, onDismiss }: { summary: AwaySummary; name: string; onDismiss: () => void }) {
  return (
    <div className="anim-rise flex items-start gap-3 rounded-lg border border-border bg-background-alt px-3.5 py-3">
      <Clock size={17} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden />
      <div className="min-w-0 flex-1 space-y-0.5 text-[13px] leading-snug text-text">
        {awayLines(summary, name).map((l) => <p key={l}>{l}</p>)}
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className="rounded-md p-1 text-text-muted hover:bg-surface-active hover:text-text">
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}
