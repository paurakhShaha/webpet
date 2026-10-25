import { DECOR } from './decor';
import { parseArt, type Grid } from './grid';

// Little pixel portraits for the people of the world. 14×14 each.
const BASE = { k: '#4B4048', f: '#F4D9BE', e: '#3F3A34', b: '#F0A8A0' };

const blacksmith = parseArt([
  '....kkkkkk....', '...kddddddk...', '..kddddddddk..', '..krrrrrrrrk..', '..kffffffffk..', '..kfeffffefk..', '..kfbffffbfk..',
  '..kfddkkddfk..', '...kfddddfk...', '..kaaaaaaaak..', '.kaAaaaaaaAak.', '.kaaaaaaaaaak.', '.kAAAAAAAAAAk.', '..kkkkkkkkkk..',
], { ...BASE, f: '#E9C4A0', d: '#6B4F3A', r: '#D96B6B', a: '#B5835A', A: '#8A6240' });

const potionMaker = parseArt([
  '......kk......', '.....kppk.....', '....kppppk....', '...kppyppPk...', '..kppppppppk..', '.kPPPPPPPPPPk.', '..kffffffffk..',
  '..kfeffffefk..', '..kfbffffbfk..', '..kfffkkfffk..', '..kcCccccCck..', '.kcccccccccck.', '.kcCcwwwwcCck.', '..kkkkkkkkkk..',
], { ...BASE, p: '#8B77C8', P: '#6A58A8', y: '#F3D77A', c: '#B8A7D9', C: '#9A88C4', w: '#9BC9D8' });

const oldExplorer = parseArt([
  '....kkkkkk....', '...kttttttk.nn', '..kttttttttk..', '.kTTTTTTTTTTk.', '..kffffffffk..', '..kfeffffefk..', '..kfbffffbfk..',
  '..kfggkkggfk..', '...kgggggggk..', '.kcccccccccck.', '.kcccccccccck.', '.kcccccccccck.', '.kcccccccccck.', '..kkkkkkkkkk..',
], { ...BASE, t: '#C9A06B', T: '#A27A47', n: '#7FAF8B', g: '#D5D0C8', c: '#8A9B7A' });

const mysteryTraveler = parseArt([
  '....kkkkkk....', '...kvvvvvvk...', '..kvvvvvvvvk..', '.kvvVVVVVVvvk.', '.kvVffffffVvk.', '.kvffyffyffvk.', '.kvffffffffvk.',
  '.kvVffffffVvk.', '..kvvVVVVvvk..', '..kvvvvvvvvk..', '.kvvvsvvvvvvk.', '.kvvvvvvvvvvk.', '.kVVVVVVVVVVk.', '..kkkkkkkkkk..',
], { k: '#2E2640', v: '#5A4B7C', V: '#41355E', f: '#2E2640', y: '#F3D77A', s: '#B8A7D9' });

/** The traveling merchant is Mossy's cousin: same cheerful look, different colours. */
const travelingMerchant = parseArt([
  '....kkkkkk....', '...khhhhhhk...', '..khhhhhhhhk..', '.khhHHHHHHhhk.', '.khHffffffHhk.', '.khffffffffhk.', '.khfeffffefhk.',
  '.khfbffffbfhk.', '.khfffkkfffhk.', '..khffffffhk..', '..ksSsSsSsSk..', '.khhSsSsSshhk.', '.khhhhhhhhhhky', '..kkkkkkkkkk..',
], { ...BASE, h: '#8FB8C9', H: '#5C8DA3', s: '#F3D77A', S: '#E9C46A', y: '#E9C46A' });

export const NPC_PORTRAITS: Record<string, Grid> = {
  'village-merchant': DECOR.shopkeeper,
  blacksmith,
  'potion-maker': potionMaker,
  'old-explorer': oldExplorer,
  'mystery-traveler': mysteryTraveler,
  'traveling-merchant': travelingMerchant,
};
