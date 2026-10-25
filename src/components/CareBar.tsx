import { Moon, Sparkles, Sun, Utensils, Gamepad2, type LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { FoodId, Pet } from '@/types';
import { cooldownRemaining } from '@/game/careActions';
import { FOODS, favoriteFood } from '@/game/foods';
import { formatDuration } from '@/utils/format';
import { FOOD_SPRITES } from '@/pixel/props';
import { PixelCanvas } from './PixelCanvas';
import { RarityBadge } from './ui';

interface Props {
  pet: Pet;
  now: number;
  trayOpen: boolean;
  onToggleTray: () => void;
  onFeed: (food: FoodId) => void;
  onPlay: () => void;
  onGroom: () => void;
  onSleep: () => void;
  onWake: () => void;
  /** Out on an adventure. */
  away?: boolean;
  /** What's in the bag, so food shows how many are left. */
  counts: Record<string, number>;
  onShop: () => void;
}

const base =
  'flex flex-col items-center gap-0.5 rounded-md border border-border bg-surface px-1 py-2 text-text shadow-card transition ' +
  'hover:border-border-hover hover:bg-surface-hover active:translate-y-px disabled:cursor-not-allowed disabled:bg-background-alt disabled:shadow-none';

function CareButton(props: { icon: LucideIcon; label: string; sub?: string; onClick: () => void; disabled?: boolean; active?: boolean; title?: string }) {
  const { icon: Icon, label, sub, onClick, disabled, active, title } = props;
  return (
    <button onClick={onClick} disabled={disabled} title={title} aria-pressed={active} className={`${base} ${active ? 'border-border-selected bg-surface-active' : ''}`}>
      <Icon size={19} className={disabled ? 'text-text-disabled' : 'text-primary-dark'} aria-hidden />
      <span className="text-[13px] font-semibold">{label}</span>
      <span className="h-3.5 text-[11px] tabular-nums text-text-muted">{sub}</span>
    </button>
  );
}

export function CareBar({ pet, now, trayOpen, onToggleTray, onFeed, onPlay, onGroom, onSleep, onWake, away = false, counts, onShop }: Props) {
  const asleep = !!pet.sleep || away;
  const why = away ? 'Away on an adventure' : 'Sleeping';
  const playCd = cooldownRemaining(pet, 'play', now);
  const groomCd = cooldownRemaining(pet, 'groom', now);
  const favorite = favoriteFood(pet);

  return (
    <div className="relative">
      {trayOpen && !asleep && (
        <div role="group" aria-label="Choose food" className="anim-rise absolute inset-x-0 bottom-full z-10 mb-2 grid grid-cols-4 gap-1.5 rounded-lg border border-border bg-surface p-2 shadow-raised">
          {Object.values(FOODS).map((food) => {
            const cd = cooldownRemaining(pet, `feed:${food.id}`, now);
            const owned = counts[food.id] ?? 0;
            return (
              <button
                key={food.id}
                onClick={() => onFeed(food.id)}
                disabled={cd > 0 || owned < 1}
                title={owned < 1 ? `No ${food.name} left` : `${food.name}: +${food.hungerRestored} fullness, +${food.happinessBonus} happiness`}
                className="flex flex-col items-center gap-1 rounded-md px-1 py-1.5 transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-8 items-center" style={{ '--px': '4px' } as CSSProperties}>
                  <PixelCanvas grid={FOOD_SPRITES[food.id] ?? FOOD_SPRITES.apple} scale={food.id === 'fish' ? 3 : 4} />
                </span>
                <span className="text-xs font-semibold text-text">{food.name}</span>
                <span className="text-[11px] tabular-nums text-text-muted">{owned < 1 ? 'None left' : cd > 0 ? formatDuration(cd) : `\u00d7${owned}`}</span>
                {food.id === favorite && cd === 0 ? <span className="text-[10px] font-semibold text-primary-dark">Favourite</span> : <RarityDot rarity={food.rarity} />}
              </button>
            );
          })}
        </div>
      )}

      {trayOpen && !asleep && Object.values(FOODS).every((f) => (counts[f.id] ?? 0) < 1) && (
        <button onClick={onShop} className="anim-rise absolute inset-x-0 bottom-full z-20 mb-2 rounded-lg border border-border bg-surface p-3 text-left text-xs text-text shadow-raised">
          Out of food! Visit the shop for more, or check your quests and the free daily basket.
        </button>
      )}

      <div className="grid grid-cols-4 gap-2">
        <CareButton icon={Utensils} label="Feed" onClick={onToggleTray} disabled={asleep} active={trayOpen && !asleep} title={asleep ? why : 'Choose a food'} />
        <CareButton icon={Gamepad2} label="Play" sub={playCd > 0 ? formatDuration(playCd) : undefined} onClick={onPlay} disabled={asleep || playCd > 0} title={asleep ? why : 'Play together'} />
        <CareButton icon={Sparkles} label="Groom" sub={groomCd > 0 ? formatDuration(groomCd) : undefined} onClick={onGroom} disabled={asleep || groomCd > 0} title={asleep ? why : 'Brush and tidy'} />
        {pet.sleep ? (
          <CareButton icon={Sun} label="Wake" onClick={onWake} title="Wake up" />
        ) : (
          <CareButton icon={Moon} label="Sleep" onClick={onSleep} disabled={away} title={away ? why : 'Put to bed'} />
        )}
      </div>
    </div>
  );
}

function RarityDot({ rarity }: { rarity: import('@/types').Rarity }) {
  return <span aria-hidden className="h-[14px]"><span className="sr-only"><RarityBadge rarity={rarity} /></span><span className="mt-1 block size-1.5 rounded-[2px]" style={{ background: `var(--color-rarity-${rarity})` }} /></span>;
}
