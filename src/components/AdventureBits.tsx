import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Difficulty, ItemId, RiskLevel } from '@/types';
import { DIFFICULTY_LABEL, RISK_LABEL } from '@/adventure/copy';
import { getItem } from '@/adventure/items';
import { itemIcon } from './icons';

const LEVEL: Record<Difficulty, { filled: number; token: string }> = {
  easy: { filled: 1, token: '--color-success' },
  normal: { filled: 2, token: '--color-warning' },
  hard: { filled: 3, token: '--color-danger' },
};

/** Three small squares plus a word, so difficulty never relies on colour alone. */
export function DifficultyPips({ difficulty }: { difficulty: Difficulty }) {
  const { filled, token } = LEVEL[difficulty];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text">
      <span aria-hidden className="flex gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2.5 rounded-[2px]" style={{ background: i < filled ? `var(${token})` : 'var(--color-surface-active)' }} />
        ))}
      </span>
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}

const RISK_ICON = { low: ShieldCheck, medium: Shield, high: ShieldAlert } as const;

export function RiskTag({ risk }: { risk: RiskLevel }) {
  const Icon = RISK_ICON[risk];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-text">
      <Icon size={14} className="text-text-muted" aria-hidden />
      {RISK_LABEL[risk]} risk
    </span>
  );
}

/** A material with its rarity as the border colour. */
export function ItemChip({ item, qty, className = '', style }: { item: ItemId; qty?: number; className?: string; style?: CSSProperties }) {
  const def = getItem(item);
  const Icon = itemIcon(def.icon);
  return (
    <span
      title={def.description}
      className={`inline-flex items-center gap-1.5 rounded-sm border bg-surface px-2 py-1 text-xs font-semibold text-text ${className}`}
      style={{ borderColor: `var(--color-rarity-${def.rarity})`, ...style }}
    >
      <Icon size={14} style={{ color: `var(--color-rarity-${def.rarity})` }} aria-hidden />
      {def.name}
      {qty !== undefined && <span className="tabular-nums text-text-muted">&times;{qty}</span>}
    </span>
  );
}
