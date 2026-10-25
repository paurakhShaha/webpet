import { useMemo } from 'react';
import type { EggLook } from '@/egg/appearance';
import { EGG_GRID, renderEggGrid, splitEggGrid } from '@/pixel/eggSprite';
import { PixelCanvas } from './PixelCanvas';

interface Props {
  look: EggLook;
  /** 0–100. Drives warmth and cracks. */
  progress: number;
  /** Splits the shell in two for the hatch reveal. */
  open?: boolean;
  scale?: number;
  mode?: 'float' | 'shake' | 'still';
  className?: string;
}

export function EggSprite({ look, progress, open = false, scale = 5, mode = 'float', className = '' }: Props) {
  const full = useMemo(() => renderEggGrid(look, progress), [look, progress]);
  const halves = useMemo(() => (open ? splitEggGrid(full) : null), [open, full]);
  const anim = mode === 'float' ? 'anim-bob' : mode === 'shake' ? 'anim-shake' : '';
  const w = EGG_GRID.w * scale;
  const h = EGG_GRID.h * scale;

  return (
    <div className={`relative ${className}`} style={{ width: w, height: h, '--px': `${scale}px` } as React.CSSProperties}>
      {(look.aura > 0 || progress > 0) && (
        <div
          aria-hidden
          className="absolute inset-[-14%] rounded-full"
          style={{ background: `radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--color-accent-yellow) ${Math.round(progress * 0.32)}%, transparent) 0%, transparent 66%)` }}
        />
      )}
      {halves ? (
        <>
          <div aria-hidden className="anim-glow-burst absolute inset-[6%] rounded-full bg-[color-mix(in_srgb,var(--color-accent-yellow)_60%,transparent)]" />
          <PixelCanvas grid={halves.bottom} scale={scale} className="anim-shell-bottom absolute inset-0" />
          <PixelCanvas grid={halves.top} scale={scale} className="anim-shell-top absolute inset-0" />
        </>
      ) : (
        <div className={anim}>
          <PixelCanvas grid={full} scale={scale} label="A mysterious egg" />
        </div>
      )}
    </div>
  );
}
