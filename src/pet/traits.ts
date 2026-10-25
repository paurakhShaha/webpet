import type { TraitDefinition } from '@/types';

export const TRAITS: readonly TraitDefinition[] = [
  { id: 'early-riser',    label: 'Early riser',    description: 'Up with the first light.' },
  { id: 'night-owl',      label: 'Night owl',      description: 'Comes alive after dark.' },
  { id: 'sweet-tooth',    label: 'Sweet tooth',    description: 'Can smell a treat from across the room.' },
  { id: 'sun-seeker',     label: 'Sun seeker',     description: 'Follows the warm patch around the floor.' },
  { id: 'storm-lover',    label: 'Storm lover',    description: 'Watches the rain like a show.' },
  { id: 'collector',      label: 'Collector',      description: 'Hoards small, shiny things.' },
  { id: 'hums-softly',    label: 'Hums softly',    description: 'Makes a low happy sound when content.' },
  { id: 'light-sleeper',  label: 'Light sleeper',  description: 'One ear always open.' },
  { id: 'moonstruck',     label: 'Moonstruck',     description: 'Gazes at the moon for hours.',           minRarity: 'rare' },
  { id: 'starlit-coat',   label: 'Starlit coat',   description: 'Fur glints like it caught some stars.',  minRarity: 'epic' },
  { id: 'ancient-soul',   label: 'Ancient soul',   description: 'Looks at you like it remembers you.',    minRarity: 'legendary' },
  { id: 'dreamwalker',    label: 'Dreamwalker',    description: 'Sometimes seems to be in two places.',   minRarity: 'mythic' },
];

export const getTrait = (id: string): TraitDefinition | undefined => TRAITS.find((t) => t.id === id);
