// Tiny colour maths for pixel-art shading. Sprite palettes are art data (not UI colours).
const INK = '#3F3A34';

const toRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}
export const darken = (hex: string, t: number) => mix(hex, INK, t);
export const lighten = (hex: string, t: number) => mix(hex, '#FFFDF8', t);
export { INK };
