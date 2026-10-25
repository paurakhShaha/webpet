import { darken, lighten } from './color';

export type Cell = string | null;
export interface Grid {
  w: number;
  h: number;
  cells: Cell[];
}

export const createGrid = (w: number, h: number): Grid => ({ w, h, cells: new Array<Cell>(w * h).fill(null) });

export function get(g: Grid, x: number, y: number): Cell {
  return x < 0 || y < 0 || x >= g.w || y >= g.h ? null : g.cells[y * g.w + x];
}
export function set(g: Grid, x: number, y: number, c: Cell): void {
  if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.cells[y * g.w + x] = c;
}
/** Paint only where the sprite already has a pixel (markings, blush…). */
export function setSolid(g: Grid, x: number, y: number, c: string): void {
  if (get(g, x, y)) set(g, x, y, c);
}

/** Mirror helper: shapes are authored on the left and flipped for the right. */
const mx = (g: Grid, x: number, mirror: boolean) => (mirror ? g.w - x : x);

export function fillEllipse(g: Grid, cx: number, cy: number, rx: number, ry: number, color: string, mirror = false): void {
  const c = mx(g, cx, mirror);
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      const dx = (x + 0.5 - c) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) set(g, x, y, color);
    }
}

export function fillPolygon(g: Grid, pts: [number, number][], color: string, mirror = false): void {
  const p = pts.map(([x, y]) => [mx(g, x, mirror), y] as const);
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      const px = x + 0.5, py = y + 0.5;
      let inside = false;
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        const [xi, yi] = p[i], [xj, yj] = p[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) set(g, x, y, color);
    }
}

export const eachSolid = (g: Grid, fn: (x: number, y: number, c: string) => void) => {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const c = get(g, x, y);
    if (c) fn(x, y, c);
  }
};

/** Cheap two-tone shading: lit top-left edges, shaded bottom-right edges. */
export function shadeEdges(g: Grid, base: string, amount = 0.14): void {
  const shade = darken(base, amount);
  const light = lighten(base, amount * 0.9);
  const src = { ...g, cells: [...g.cells] };
  eachSolid(src, (x, y, c) => {
    if (c !== base) return;
    if (!get(src, x, y + 1) || !get(src, x + 1, y) || get(src, x, y + 1) !== base) set(g, x, y, shade);
    else if (!get(src, x, y - 1) || !get(src, x - 1, y)) set(g, x, y, light);
  });
}

/** Adds a 1px outline around the silhouette. */
export function addOutline(g: Grid, color: string): void {
  const src = { ...g, cells: [...g.cells] };
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      if (get(src, x, y)) continue;
      if (get(src, x + 1, y) || get(src, x - 1, y) || get(src, x, y + 1) || get(src, x, y - 1)) set(g, x, y, color);
    }
}

/** Build a small grid from ASCII art + legend (used for decorative details). */
export function parseArt(rows: string[], legend: Record<string, string>): Grid {
  const g = createGrid(Math.max(...rows.map((r) => r.length)), rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => set(g, x, y, legend[ch] ?? null)));
  return g;
}
