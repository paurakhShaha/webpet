import type { ItemDefinition } from '@/types';
import { itemIcon } from './icons';

/** An item's icon on a small tile whose border shows its rarity. */
export function ItemIcon({ item, size = 40, dim = false }: { item: ItemDefinition; size?: number; dim?: boolean }) {
  const Icon = itemIcon(item.icon);
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-md border-2 bg-surface ${dim ? 'opacity-50' : ''}`}
      style={{ width: size, height: size, borderColor: `var(--color-rarity-${item.rarity})` }}
    >
      <Icon size={Math.round(size * 0.5)} style={{ color: `var(--color-rarity-${item.rarity})` }} />
    </span>
  );
}
