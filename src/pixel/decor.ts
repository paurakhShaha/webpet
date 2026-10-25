import { parseArt, type Grid } from './grid';

// Small pixel-art details for the pet's little world. Purely decorative.
const LEAF = { l: '#8FBE9B', L: '#6E9D7B', s: '#527A61' };

const NPC = { k: '#4B4048', h: '#7FAF8B', H: '#527A61', f: '#F4D9BE', e: '#3F3A34', b: '#F0A8A0', s: '#F4B8A4', S: '#E9A28B', y: '#F3D77A' };

export const DECOR: Record<'sprout' | 'sparkle' | 'cloud' | 'egg' | 'shopkeeper', Grid> = {
  // Mossy, the shopkeeper: a friendly hooded figure with a scarf and a little lantern.
  shopkeeper: parseArt([
    '....kkkkkk....',
    '...khhhhhhk...',
    '..khhhhhhhhk..',
    '.khhHHHHHHhhk.',
    '.khHffffffHhk.',
    '.khffffffffhk.',
    '.khfeffffefhk.',
    '.khfbffffbfhk.',
    '.khfffkkfffhk.',
    '..khffffffhk..',
    '..ksSsSsSsSk..',
    '.khhSsSsSshhk.',
    '.khhhhhhhhhhky',
    '..kkkkkkkkkk..',
  ], NPC),
  sprout: parseArt([
    '.ll...ll.',
    'lLLl.lLLl',
    '.lLLlLLl.',
    '..lLLLl..',
    '...lsl...',
    '....s....',
    '....s....',
  ], LEAF),
  sparkle: parseArt([
    '..y..',
    '.yyy.',
    'yyyyy',
    '.yyy.',
    '..y..',
  ], { y: '#F3D77A' }),
  cloud: parseArt([
    '....cccc....',
    '..cccccccc..',
    '.cccccccccc.',
    'ccccccccccc.',
    '.cccccccccc.',
  ], { c: '#C9E0E8' }),
  egg: parseArt([
    '..ooo..',
    '.ooooo.',
    'oooooo.',
    'ooaooo.',
    'oooaoo.',
    '.ooooo.',
    '..ooo..',
  ], { o: '#F2EEE5', a: '#9B9B94' }),
};
