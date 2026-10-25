import { parseArt, type Grid } from './grid';
import { DECOR } from './decor';

// Small pixel props used in animations: foods, a ball, hearts, sleep "Z"s.
export const FOOD_SPRITES: Record<string, Grid> = {
  apple: parseArt([
    '....s...',
    '...sgg..',
    '.rrrrrr.',
    'rrRrrrrr',
    'rrRrrrrr',
    'rrrrrrrr',
    '.rrrrrr.',
    '..rr.rr.',
  ], { r: '#E0796F', R: '#F0A79C', s: '#8A6A4F', g: '#7FAF8B' }),
  berry: parseArt([
    '...g.g..',
    '..gggg..',
    '.bb.bb..',
    'bBbbBbb.',
    'bbbbbbb.',
    '.bb.bb..',
  ], { b: '#8E7CC3', B: '#B8A7D9', g: '#7FAF8B' }),
  meat: parseArt([
    '..mmmm..',
    '.mMmmmm.',
    '.mmmmmm.',
    '.mmmmmm.',
    '..mmmm..',
    '...bb...',
    '..bbbb..',
    '..b..b..',
  ], { m: '#C9836B', M: '#DFA792', b: '#F2EEE5' }),
  fish: parseArt([
    '....ff....',
    '..ffffff.f',
    '.ffeffffff',
    '..ffffff.f',
    '....ff....',
  ], { f: '#8FB8C9', e: '#3F3A34' }),
};

export const PROPS = {
  ball: parseArt([
    '.oooo.',
    'oOoooo',
    'oooooo',
    'oooooo',
    '.oooo.',
  ], { o: '#E9A28B', O: '#F4C8B9' }),
  heart: parseArt([
    '.hh.hh.',
    'hhhhhhh',
    'hhhhhhh',
    '.hhhhh.',
    '..hhh..',
    '...h...',
  ], { h: '#E98B8B' }),
  sparkle: DECOR.sparkle,
  z: parseArt([
    'zzzzz',
    '...z.',
    '..z..',
    '.z...',
    'zzzzz',
  ], { z: '#8DBDD1' }),
};
