import type { Expression, PetAppearance } from '@/types';
import { addOutline, createGrid, fillEllipse, fillPolygon, set, setSolid, shadeEdges, type Grid } from './grid';
import { darken, lighten } from './color';

/**
 * Procedural pixel-art pets on a 32×32 grid. Everything is driven by PetAppearance,
 * so hand-drawn sprite sheets can replace this file without touching game logic.
 */
export const PET_GRID_SIZE = 32;

const NOSE = '#4A3B3F';
const BLUSH = '#F0A8A0';
const EYE_DARK = '#3F3A34';
const EYE_LIGHT = '#FFFDF8';

type EyePixel = [dx: number, dy: number, kind: 'd' | 'w' | 'i'];
const EYES: Record<PetAppearance['eyes'], EyePixel[]> = {
  round:   [[0, 0, 'w'], [1, 0, 'd'], [0, 1, 'd'], [1, 1, 'd']],
  sparkle: [[0, 0, 'w'], [1, 0, 'd'], [0, 1, 'd'], [1, 1, 'i'], [0, 2, 'i'], [1, 2, 'i']],
  sleepy:  [[-1, 1, 'd'], [0, 2, 'd'], [1, 2, 'd'], [2, 1, 'd']],
  sharp:   [[1, 0, 'd'], [2, 0, 'd'], [0, 1, 'd'], [1, 1, 'i'], [2, 1, 'd']],
};
const BLINK: EyePixel[] = [[0, 1, 'd'], [1, 1, 'd']];

const BODY = {
  round: { cy: 23, rx: 8, ry: 6 },
  plump: { cy: 22.5, rx: 9.5, ry: 6.5 },
  slim: { cy: 22.5, rx: 7, ry: 6.5 },
} as const;

function drawTail(g: Grid, style: PetAppearance['tail'], P: string, S: string) {
  switch (style) {
    case 'bushy':
      fillEllipse(g, 25.5, 24.5, 3, 3, P); fillEllipse(g, 27.5, 20.5, 2.8, 2.8, P); fillEllipse(g, 28, 16.8, 2.4, 2.4, S);
      break;
    case 'thin':
      for (const [x, y] of [[24.5, 26.5], [26.8, 25.5], [28.4, 23.5], [29, 21], [28.6, 18.5]]) fillEllipse(g, x, y, 1.3, 1.3, P);
      break;
    case 'curled':
      for (const [x, y] of [[24.8, 27], [27.5, 26.3], [29.2, 24], [29, 21.3], [27.2, 19.6], [25.6, 20.6]]) fillEllipse(g, x, y, 1.4, 1.4, P);
      break;
    case 'puff':
      fillEllipse(g, 25, 26.5, 2.8, 2.8, S);
      break;
  }
}

function drawEars(g: Grid, style: PetAppearance['ears'], P: string, S: string, behind: boolean) {
  for (const mirror of [false, true]) {
    switch (style) {
      case 'pointed':
        if (behind) { fillPolygon(g, [[5.5, 9], [6, 2], [13, 6.5]], P, mirror); fillPolygon(g, [[7, 8], [7.3, 4.2], [10.8, 6.8]], S, mirror); }
        break;
      case 'tall':
        if (behind) { fillPolygon(g, [[5.5, 9.5], [6.5, 1.2], [14, 7.2]], P, mirror); fillPolygon(g, [[7, 8.3], [7.6, 3.6], [11.4, 7]], S, mirror); }
        break;
      case 'round':
        if (behind) { fillEllipse(g, 8, 6.2, 3.6, 3.6, P, mirror); fillEllipse(g, 8, 6.6, 1.9, 1.9, S, mirror); }
        break;
      case 'long':
        if (behind) { fillEllipse(g, 10, 5.5, 2.4, 4.6, P, mirror); fillEllipse(g, 10, 6, 1.1, 3.2, S, mirror); }
        break;
      case 'floppy':
        if (!behind) fillEllipse(g, 6.3, 12.5, 2.8, 5, darken(P, 0.22), mirror);
        break;
    }
  }
}

function drawMarkings(g: Grid, a: PetAppearance, blob: boolean) {
  const M = a.markingColor;
  const hy = blob ? 7 : 0;
  const fy = blob ? 6 : 0;
  const dots = (pts: [number, number][]) => pts.forEach(([x, y]) => setSolid(g, x, y, M));
  switch (a.markings) {
    case 'blaze':
      for (let y = 6; y <= 10; y++) dots([[15, y + hy], [16, y + hy]]);
      break;
    case 'spots':
      dots([[10, 9 + hy], [21, 8 + hy], [19, 10 + hy]]);
      dots(blob ? [[10, 22], [21, 24], [15, 26]] : [[12, 22], [20, 21], [17, 26]]);
      break;
    case 'stripes':
      for (const [x, y0, y1] of [[12, 7, 9], [15, 6, 8], [16, 6, 8], [19, 7, 9]] as const)
        for (let y = y0; y <= y1; y++) setSolid(g, x, y + hy, M);
      if (!blob) for (let y = 20; y <= 22; y++) dots([[9, y], [22, y]]);
      break;
    case 'star':
      dots([[16, 7 + hy], [15, 8 + hy], [16, 8 + hy], [17, 8 + hy], [16, 9 + hy]]);
      break;
    case 'freckles':
      dots([[9, 14 + fy], [10, 16 + fy], [22, 14 + fy], [21, 16 + fy]]);
      break;
  }
}

type EyeSet = EyePixel[];
const EYE_SETS: Partial<Record<Expression, EyeSet>> = {
  blink: BLINK,
  sleep: BLINK,
  yawn: BLINK,
  happy: [[-1, 1, 'd'], [0, 0, 'd'], [1, 0, 'd'], [2, 1, 'd']],
  eat: [[-1, 1, 'd'], [0, 0, 'd'], [1, 0, 'd'], [2, 1, 'd']],
  shy: [[-1, 1, 'd'], [0, 2, 'd'], [1, 2, 'd'], [2, 1, 'd']],
  sad: [[0, 1, 'w'], [1, 1, 'd'], [0, 2, 'd'], [1, 2, 'd']],
  surprised: [[0, 0, 'w'], [1, 0, 'd'], [0, 1, 'd'], [1, 1, 'd'], [0, 2, 'd'], [1, 2, 'd']],
};

const PINK = '#E98B8B';
const TEAR = '#9BC9D8';
type MouthPixel = [x: number, y: number, color?: string];
/** Mouths are authored for the head; slimes shift them down 5 rows. */
const MOUTHS: Record<Expression, MouthPixel[]> = {
  normal: [[14, 17], [15, 18], [16, 18], [17, 17]],
  blink: [[14, 17], [15, 18], [16, 18], [17, 17]],
  sleep: [[15, 18], [16, 18]],
  shy: [[15, 18], [16, 18]],
  happy: [[14, 17], [15, 18], [16, 18], [17, 17], [15, 17, PINK], [16, 17, PINK]],
  sad: [[14, 18], [15, 17], [16, 17], [17, 18]],
  eat: [[15, 17], [16, 17], [15, 18, PINK], [16, 18, PINK]],
  surprised: [[15, 17], [16, 17], [15, 18], [16, 18]],
  yawn: [[15, 17], [16, 17], [15, 18, PINK], [16, 18, PINK], [15, 19], [16, 19]],
};

/** Cosmetics are drawn straight onto the sprite (before the outline), so they look like part of the pet. */
function drawCosmetic(g: Grid, id: string, blob: boolean) {
  const hy = blob ? 7 : 0; // slimes are shorter: head items sit lower
  const put = (pts: [number, number][], color: string, dy = hy) => pts.forEach(([x, y]) => set(g, x, y + dy, color));
  switch (id) {
    case 'red-bow':
      put([[20, 4], [20, 5], [20, 6], [21, 5], [24, 4], [24, 5], [24, 6], [23, 5], [21, 4], [23, 4], [21, 6], [23, 6]], '#E98B8B');
      put([[22, 5]], '#C45757');
      break;
    case 'flower-clip':
      put([[10, 5], [9, 6], [11, 6], [10, 7]], '#F4B8A4');
      put([[10, 6]], '#F3D77A');
      break;
    case 'leaf-crown':
      for (let x = 12; x <= 20; x++) put([[x, 5]], x % 2 ? '#7FAF8B' : '#6E9D7B');
      put([[13, 4], [14, 4], [18, 4], [19, 4], [16, 4]], '#8FBE9B');
      put([[12, 6], [20, 6]], '#6E9D7B');
      break;
    case 'cozy-scarf': {
      const y0 = blob ? 26 : 20;
      for (let x = 9; x <= 22; x++) { set(g, x, y0, (x + 1) % 4 < 2 ? '#E9A28B' : '#F4C8B9'); set(g, x, y0 + 1, (x + 1) % 4 < 2 ? '#F4C8B9' : '#E9A28B'); }
      put([[21, y0 + 2], [21, y0 + 3], [22, y0 + 2], [22, y0 + 3], [21, y0 + 4]], '#E9A28B', 0);
      break;
    }
    case 'star-clip':
      put([[22, 5], [21, 6], [22, 6], [23, 6], [22, 7]], '#F3D77A');
      put([[22, 6]], '#FFF3C2');
      break;
  }
}

export function renderPetGrid(
  a: PetAppearance,
  irisColor: string,
  opts: { blink?: boolean; expression?: Expression; cosmetic?: string | null } = {},
): Grid {
  const expression: Expression = opts.expression ?? (opts.blink ? 'blink' : 'normal');
  const g = createGrid(PET_GRID_SIZE, PET_GRID_SIZE);
  const P = a.primaryColor, S = a.secondaryColor;
  const blob = a.body === 'blob';

  drawTail(g, a.tail, P, S);

  if (blob) {
    fillEllipse(g, 16, 19, 11, 10.8, P);
  } else {
    const b = BODY[a.body as keyof typeof BODY];
    fillEllipse(g, 16, b.cy, b.rx, b.ry, P);
    drawEars(g, a.ears, P, S, true);
    fillEllipse(g, 16, 13, 9.5, 8, P); // head
    fillEllipse(g, 16, 24.2, 4.6, 3.6, S); // belly
    fillEllipse(g, 16, 16.6, 4.2, 2.8, S); // muzzle
    const paw = a.markings === 'socks' ? a.markingColor : S;
    fillEllipse(g, 11.5, 28.6, 2.6, 1.3, paw);
    fillEllipse(g, 20.5, 28.6, 2.6, 1.3, paw);
    drawEars(g, a.ears, P, S, false);
  }

  shadeEdges(g, P);
  if (blob) {
    for (const [x, y] of [[10, 11], [11, 11], [9, 12], [9, 13]]) setSolid(g, x, y, lighten(P, 0.55));
  }
  drawMarkings(g, a, blob);

  // Face
  const fy = blob ? 6 : 0;
  const normalEyes = EYES[a.eyes];
  const eyes = expression === 'normal' ? normalEyes : expression === 'blink' && a.eyes === 'sleepy' ? normalEyes : (EYE_SETS[expression] ?? normalEyes);
  const eyeColor = { d: EYE_DARK, w: EYE_LIGHT, i: irisColor } as const;
  for (const [dx, dy, kind] of eyes) {
    const y = 12 + fy + dy;
    set(g, 10 + dx, y, eyeColor[kind]);
    set(g, 31 - (10 + dx), y, eyeColor[kind]);
  }
  if (expression === 'sad') {
    set(g, 10, 15 + fy, TEAR);
    set(g, 21, 15 + fy, TEAR);
  }
  const blushY = blob ? 21 : 15;
  for (const x of blob ? [8, 9, 22, 23] : [7, 8, 23, 24]) setSolid(g, x, blushY, BLUSH);
  if (expression === 'shy') for (const x of blob ? [9, 22] : [8, 23]) setSolid(g, x, blushY + 1, BLUSH);
  if (!blob) {
    set(g, 15, 15, NOSE);
    set(g, 16, 15, NOSE);
  }
  for (const [x, y, color] of MOUTHS[expression]) set(g, x, y + (blob ? 5 : 0), color ?? NOSE);

  if (opts.cosmetic) drawCosmetic(g, opts.cosmetic, blob);
  addOutline(g, darken(P, 0.55));
  return g;
}
