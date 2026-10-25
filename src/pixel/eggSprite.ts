import type { EggLook } from '@/egg/appearance';
import { addOutline, createGrid, get, set, setSolid, shadeEdges, type Grid } from './grid';
import { darken, lighten, mix } from './color';

export const EGG_GRID = { w: 32, h: 40 };
const GLOW = '#F3D77A';
const CRACK = '#7A6B5C';

/** Cracks appear from 50% and spread as progress rises. */
const CRACKS: { at: number; pts: [number, number][] }[] = [
  { at: 50, pts: [[16, 6], [15, 7], [15, 8], [16, 9], [17, 10], [17, 11], [16, 12], [15, 13]] },
  { at: 62, pts: [[15, 13], [14, 14], [15, 15], [16, 16], [16, 17], [17, 18]] },
  { at: 78, pts: [[17, 10], [18, 10], [19, 11], [20, 11], [21, 12]] },
  { at: 92, pts: [[16, 17], [15, 18], [14, 19], [14, 20], [13, 21]] },
];

export function renderEggGrid(look: EggLook, progress: number): Grid {
  const g = createGrid(EGG_GRID.w, EGG_GRID.h);
  const { base, accent } = look;

  for (let y = 0; y < g.h; y++) {
    const t = (y + 0.5 - 22) / 18;
    if (Math.abs(t) > 1) continue;
    const half = 11.5 * Math.sqrt(1 - t * t) * (1 + 0.14 * t);
    for (let x = 0; x < g.w; x++) if (Math.abs(x + 0.5 - 16) <= half) set(g, x, y, base);
  }

  // Warmth glows from the middle as the egg gets closer to hatching.
  const strength = Math.min(0.6, (progress / 100) * 0.65);
  const warmInner = mix(base, GLOW, strength);
  const warmOuter = mix(base, GLOW, strength * 0.45);
  if (progress >= 25) {
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const dx = (x + 0.5 - 16) / 8, dy = (y + 0.5 - 25) / 11;
      const d = dx * dx + dy * dy;
      if (d <= 1 && get(g, x, y) === base) set(g, x, y, d <= 0.3 ? warmInner : warmOuter);
    }
  }

  shadeEdges(g, base, 0.12);
  for (const [x, y] of [[10, 12], [10, 13], [11, 11], [11, 12]]) setSolid(g, x, y, lighten(base, 0.7));

  const speck = mix(accent, base, 0.15);
  for (const s of look.speckles) for (let i = 0; i < s.size; i++) setSolid(g, s.x + i, s.y, speck);

  const glowing = progress >= 75;
  for (const crack of CRACKS.filter((c) => progress >= c.at)) {
    for (const [x, y] of crack.pts) {
      setSolid(g, x, y, CRACK);
      if (glowing && get(g, x + 1, y) && get(g, x + 1, y) !== CRACK) set(g, x + 1, y, GLOW);
    }
  }

  addOutline(g, darken(accent, 0.4));
  return g;
}

const SPLIT_OFFSETS = [0, 1, 2, 1, 0, -1, -2, -1];
/** Splits the shell along a jagged line for the hatch reveal. */
export function splitEggGrid(full: Grid): { top: Grid; bottom: Grid } {
  const top = createGrid(full.w, full.h);
  const bottom = createGrid(full.w, full.h);
  for (let y = 0; y < full.h; y++)
    for (let x = 0; x < full.w; x++) {
      const c = get(full, x, y);
      const line = 21 + SPLIT_OFFSETS[x % SPLIT_OFFSETS.length];
      set(y < line ? top : bottom, x, y, c);
    }
  return { top, bottom };
}
