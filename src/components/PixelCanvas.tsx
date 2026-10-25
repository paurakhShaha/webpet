import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Grid } from '@/pixel/grid';

/** Draws a pixel grid 1:1 onto a tiny canvas; CSS scales it with no smoothing. */
export function PixelCanvas({ grid, scale, label, className = '', style }: {
  grid: Grid; scale: number; label?: string; className?: string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, grid.w, grid.h);
    grid.cells.forEach((color, i) => {
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(i % grid.w, Math.floor(i / grid.w), 1, 1);
    });
  }, [grid]);

  return (
    <canvas
      ref={ref}
      width={grid.w}
      height={grid.h}
      className={`pixelated block ${className}`}
      style={{ width: grid.w * scale, height: grid.h * scale, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
