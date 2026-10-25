import { NAV_ITEMS, type NavId } from '@/game/navigation';
import { NAV_ICONS } from './icons';

export function NavBar({ active, onNavigate, dots }: { active: NavId; onNavigate: (id: NavId) => void; dots?: Partial<Record<NavId, boolean>> }) {
  return (
    <nav aria-label="Sections" className="mt-2 grid grid-cols-7 gap-0.5 border-t border-border pb-3 pt-2">
      {NAV_ITEMS.map((item) => {
        const Icon = NAV_ICONS[item.id];
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            disabled={!item.enabled}
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
            title={item.enabled ? item.label : `${item.label} \u2014 coming soon`}
            className={`relative flex flex-col items-center gap-1 rounded-md px-0 py-1.5 text-[10px] font-semibold transition disabled:cursor-not-allowed ${
              isActive ? 'bg-primary/20 text-primary-dark' : item.enabled ? 'text-text-muted hover:bg-surface-active' : 'text-text-disabled'
            }`}
          >
            <Icon size={18} aria-hidden />
            {item.label}
            {dots?.[item.id] && <span aria-hidden className="absolute right-1.5 top-0.5 size-2 rounded-[2px] bg-secondary-hover" />}
          </button>
        );
      })}
    </nav>
  );
}
