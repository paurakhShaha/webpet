import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Coins, Lightbulb, X, type LucideIcon } from 'lucide-react';
import type { ElementId, Rarity } from '@/types';
import { RARITY_CONFIG } from '@/rarity';
import { ELEMENTS } from '@/pet/elements';
import { DECOR } from '@/pixel/decor';
import { ELEMENT_ICONS } from './icons';
import { PixelCanvas } from './PixelCanvas';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: LucideIcon;
};

const VARIANTS = {
  primary: 'bg-primary text-text-on-primary hover:bg-primary-hover shadow-card',
  secondary: 'bg-secondary text-text-on-secondary hover:bg-secondary-hover shadow-card',
  ghost: 'text-primary-dark hover:bg-surface-active',
} as const;

export function Button({ variant = 'primary', icon: Icon, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[15px] font-semibold transition
        active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${VARIANTS[variant]} ${className}`}
    >
      {Icon && <Icon size={18} strokeWidth={2} aria-hidden />}
      {children}
    </button>
  );
}

/** Border in the rarity colour; text stays in the normal text colour for readability. */
export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border bg-surface px-2 py-0.5 text-xs font-semibold text-text"
      style={{ borderColor: `var(--color-rarity-${rarity})` }}
    >
      <span className="size-2 rounded-[2px]" style={{ background: `var(--color-rarity-${rarity})` }} />
      {RARITY_CONFIG[rarity].label}
    </span>
  );
}

export function ElementChip({ element }: { element: ElementId }) {
  const Icon = ELEMENT_ICONS[element];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-background-alt px-2 py-0.5 text-xs font-medium text-text">
      <Icon size={13} style={{ color: `var(--color-element-${element})` }} aria-hidden />
      {ELEMENTS[element].label}
    </span>
  );
}

export function Chip({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span title={title} className="rounded-sm bg-background-alt px-2 py-0.5 text-xs font-medium text-text-muted">
      {children}
    </span>
  );
}

export function ProgressBar(props: { value: number; max?: number; ticks?: readonly number[]; label: string; color?: string }) {
  const { value, max = 100, ticks = [], label, color = 'var(--color-primary)' } = props;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.floor(value)}
      className="relative h-2.5 w-full rounded-sm bg-surface-active">
      <div className="h-full rounded-sm transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
      {ticks.map((t) => (
        <span key={t} className="absolute top-0 h-full w-px bg-border-hover" style={{ left: `${(t / max) * 100}%` }} />
      ))}
    </div>
  );
}

/** Full-height column used by every screen. */
export function Screen({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <main className={`relative mx-auto flex h-full w-full max-w-[440px] flex-col px-5 ${className}`}>{children}</main>;
}

/**
 * The little world behind the pet or egg: a calm cream surface with a few
 * pixel-art details. Keeps the character as the single focal point.
 */
export function Stage({ children, className = '', decor = true, overlay, backdrop, corner }: { children: ReactNode; className?: string; decor?: boolean; overlay?: ReactNode; backdrop?: ReactNode; corner?: ReactNode }) {
  return (
    <section className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-surface shadow-card ${className}`}>
      {backdrop}
      {decor && (
        <>
          <PixelCanvas grid={DECOR.cloud} scale={3} className="absolute right-4 top-4 opacity-80" />
          <PixelCanvas grid={DECOR.sparkle} scale={2} className="absolute left-5 top-6 opacity-80" />
          <PixelCanvas grid={DECOR.sprout} scale={3} className="absolute bottom-3 left-4" />
          <PixelCanvas grid={DECOR.sparkle} scale={2} className="absolute bottom-10 right-6 opacity-60" />
        </>
      )}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-3 bg-background-alt" />
      <div className="relative">{children}</div>
      {overlay && <div className="absolute inset-x-0 top-3 z-10 flex justify-center px-3">{overlay}</div>}
      {corner && <div className="absolute bottom-4 left-3 z-10">{corner}</div>}
    </section>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-md border transition-colors ${
        checked ? 'border-primary-hover bg-primary' : 'border-border-hover bg-surface-active'
      }`}
    >
      <span className={`absolute top-0.5 size-4.5 rounded-sm bg-surface shadow-card transition-[left] ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

// ── v0.4 shared bits ─────────────────────────────────────────

export function GoldPill({ gold }: { gold: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-background-alt px-2 py-1 text-xs font-semibold text-text" title="Gold">
      <Coins size={14} className="text-warning" aria-hidden />
      <span className="tabular-nums">{gold.toLocaleString()}</span>
      <span className="sr-only">gold</span>
    </span>
  );
}

/** A segmented control for switching between a few views. */
export function SegTabs<T extends string>({ tabs, value, onChange, label }: {
  tabs: readonly { id: T; label: string; badge?: number }[]; value: T; onChange: (id: T) => void; label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-md bg-background-alt p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === value}
          onClick={() => onChange(t.id)}
          className={`min-w-0 flex-1 truncate rounded-sm px-1.5 py-1.5 text-xs font-semibold transition ${
            t.id === value ? 'bg-surface text-text shadow-card' : 'text-text-muted hover:text-text'
          }`}
        >
          {t.label}
          {t.badge ? <span className="ml-1 tabular-nums text-text-muted">{t.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** A friendly one-time hint. Dismissed hints are remembered in the save. */
export function Tip({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-background-alt px-3 py-2.5 text-xs leading-snug text-text">
      <Lightbulb size={15} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden />
      <p className="flex-1">{children}</p>
      <button onClick={onDismiss} aria-label="Dismiss tip" className="rounded-sm p-0.5 text-text-muted hover:text-text"><X size={14} aria-hidden /></button>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border-hover px-4 py-6 text-center text-sm text-text-muted">{children}</p>;
}
