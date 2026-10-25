import type { LucideIcon } from 'lucide-react';

/** A labelled meter in a status colour. Very low values get a warm outline — colour is never the only cue. */
export function StatBar({ icon: Icon, label, value, token, hint }: {
  icon: LucideIcon; label: string; value: number; token: string; hint?: string;
}) {
  const v = Math.round(value);
  const low = v < 25;
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={16} style={{ color: `var(${token})` }} className="shrink-0" aria-hidden />
      <span className="w-[72px] shrink-0 text-[13px] font-semibold text-text">{label}</span>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        aria-valuetext={hint ? `${v} of 100, ${hint}` : `${v} of 100`}
        className={`h-2.5 flex-1 rounded-sm bg-surface-active ${low ? 'ring-1 ring-warning' : ''}`}
      >
        <div className="h-full rounded-sm transition-[width] duration-500" style={{ width: `${v}%`, background: `var(${token})` }} />
      </div>
      <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-text-muted">{v}</span>
    </div>
  );
}
