import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ElementId, Expression, FoodId, Mood, PetAnimation, PetAppearance, Rarity } from '@/types';
import { ANIMATION_EXPRESSION } from '@/game/animation';
import { ELEMENTS } from '@/pet/elements';
import { RARITY_CONFIG } from '@/rarity';
import { renderPetGrid, PET_GRID_SIZE } from '@/pixel/petSprite';
import { FOOD_SPRITES, PROPS } from '@/pixel/props';
import type { Grid } from '@/pixel/grid';
import { PixelCanvas } from './PixelCanvas';

/** A one-off thing the pet is doing. `key` restarts the animation even if it's the same kind. */
export interface Activity {
  animation: PetAnimation;
  key: number;
  food?: FoodId;
  /** Pixels to lean toward the cursor (playful reactions). */
  dx?: number;
}

interface Props {
  appearance: PetAppearance;
  element: ElementId;
  rarity: Rarity;
  /** Screen pixels per art pixel. */
  scale?: number;
  animated?: boolean;
  sleeping?: boolean;
  mood?: Mood;
  activity?: Activity | null;
  /** Cosmetic item id drawn on the pet. */
  cosmetic?: string | null;
  className?: string;
}

const MOTION: Record<PetAnimation, string> = {
  idle: 'anim-bob', blink: 'anim-bob', bounce: 'anim-bounce', eat: 'anim-chew', happy: 'anim-happy',
  sad: 'anim-droop', sleep: 'anim-breathe', play: 'anim-play', groom: 'anim-happy', hide: 'anim-hide',
  surprised: 'anim-startle', yawn: 'anim-breathe', levelup: 'anim-cheer',
};

export function PetSprite({
  appearance, element, rarity, scale = 5, animated = true, sleeping = false, mood, activity = null, cosmetic = null, className = '',
}: Props) {
  const iris = ELEMENTS[element].color;
  const cache = useMemo(() => new Map<Expression, Grid>(), [appearance, iris, cosmetic]);
  const gridFor = (e: Expression): Grid => {
    let g = cache.get(e);
    if (!g) { g = renderPetGrid(appearance, iris, { expression: e, cosmetic }); cache.set(e, g); }
    return g;
  };

  const animation: PetAnimation = activity?.animation ?? (sleeping ? 'sleep' : mood === 'sad' ? 'sad' : 'idle');
  const [blink, setBlink] = useState(false);
  const [chew, setChew] = useState(false);
  const { aura } = RARITY_CONFIG[rarity];
  const size = PET_GRID_SIZE * scale;

  // Blink now and then while idle — enough to feel alive without being busy.
  useEffect(() => {
    if (!animated || animation !== 'idle' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let off: ReturnType<typeof setTimeout>;
    const id = setInterval(() => { setBlink(true); off = setTimeout(() => setBlink(false), 160); }, 4200);
    return () => { clearInterval(id); clearTimeout(off); };
  }, [animated, animation]);

  useEffect(() => {
    if (animation !== 'eat') return;
    const id = setInterval(() => setChew((c) => !c), 260);
    return () => clearInterval(id);
  }, [animation]);

  const expression: Expression =
    animation === 'idle' ? (blink ? 'blink' : 'normal') : animation === 'eat' ? (chew ? 'eat' : 'normal') : ANIMATION_EXPRESSION[animation];
  const motion = !animated ? '' : activity?.dx !== undefined && animation === 'play' ? 'anim-lean' : MOTION[animation];
  const px = (n: number) => n * scale;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size, '--px': `${scale}px` } as CSSProperties}>
      {/* Rarity is a quiet glow behind the pet, never a flood of colour. */}
      {aura > 0 && (
        <div
          aria-hidden
          className="absolute inset-[-10%] rounded-full"
          style={{ background: `radial-gradient(circle at 50% 55%, color-mix(in srgb, var(--color-rarity-${rarity}) ${Math.round(aura * 38)}%, transparent) 0%, transparent 68%)` }}
        />
      )}
      <div aria-hidden className="absolute bottom-[2%] left-1/2 h-[6%] w-[52%] -translate-x-1/2 rounded-[50%] bg-(--color-ground-shadow)" />

      <div key={activity?.key ?? 'rest'} className={`relative ${motion}`} style={activity?.dx !== undefined ? ({ '--dx': `${activity.dx}px` } as CSSProperties) : undefined}>
        <PixelCanvas grid={gridFor(expression)} scale={scale} label="Your pet" />
      </div>

      {/* Props for the current activity */}
      {activity?.food && animated && (
        <div key={`food-${activity.key}`} aria-hidden className="anim-food absolute" style={{ left: px(12), top: px(12) }}>
          <PixelCanvas grid={FOOD_SPRITES[activity.food] ?? FOOD_SPRITES.apple} scale={scale} />
        </div>
      )}
      {animation === 'play' && animated && (
        <div aria-hidden className="anim-ball absolute" style={{ left: px(25), top: px(24) }}>
          <PixelCanvas grid={PROPS.ball} scale={scale} />
        </div>
      )}
      {(animation === 'happy' || animation === 'groom' || animation === 'levelup') && animated && [0, 1, 2].map((i) => (
        <div key={`${activity?.key}-${i}`} aria-hidden className="anim-float-up absolute" style={{ left: px(6 + i * 8), top: px(3), animationDelay: `${i * 140}ms` }}>
          <PixelCanvas grid={animation === 'groom' || animation === 'levelup' ? PROPS.sparkle : PROPS.heart} scale={Math.max(1, Math.round(scale / 2.5))} />
        </div>
      ))}
      {animation === 'sleep' && animated && [0, 1].map((i) => (
        <div key={i} aria-hidden className="anim-zzz absolute" style={{ left: px(24 + i * 3), top: px(6 - i * 3), animationDelay: `${i * 1.2}s` }}>
          <PixelCanvas grid={PROPS.z} scale={Math.max(1, Math.round(scale / 2.5))} />
        </div>
      ))}
    </div>
  );
}
