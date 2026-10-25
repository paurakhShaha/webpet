import type { SpeciesDefinition, SpeciesId } from '@/types';

/**
 * ADD A SPECIES: append an object here, then list its id in one or more
 * egg pools (src/egg/pools.ts). No engine changes needed.
 * The first entry of each appearance list is the species' "base" look.
 */
const DEFINITIONS: SpeciesDefinition[] = [
  {
    id: 'fox', name: 'Fox',
    description: 'Clever, warm, and always a step ahead.',
    baseStats: { vitality: 9, strength: 8, agility: 12, intellect: 12, charm: 10 },
    elements: ['fire', 'wind', 'light', 'nature', 'shadow'],
    personalities: ['curious', 'mischievous', 'adventurous', 'playful', 'brave', 'shy'],
    appearance: {
      bodies: ['slim'], eyes: ['sharp', 'sparkle', 'round'], ears: ['pointed'], tails: ['bushy'],
      markings: ['blaze', 'socks', 'none', 'freckles', 'star'],
      palettes: [
        { name: 'Ember',  primary: '#E8895A', secondary: '#FFF0DC', marking: '#B85F3D' },
        { name: 'Ash',    primary: '#B7B3C9', secondary: '#F4F0FA', marking: '#7E7A99' },
        { name: 'Snow',   primary: '#F1EEF7', secondary: '#D5CDE6', marking: '#A79BC7' },
        { name: 'Dusk',   primary: '#9375C4', secondary: '#EBDDF7', marking: '#66499A' },
      ],
    },
    evolution: { familyId: 'fox', stage: 1, evolvesTo: [] },
  },
  {
    id: 'cat', name: 'Cat',
    description: 'Independent, until it decides you are its person.',
    baseStats: { vitality: 9, strength: 8, agility: 13, intellect: 11, charm: 11 },
    elements: ['shadow', 'light', 'wind', 'water'],
    personalities: ['lazy', 'curious', 'shy', 'mischievous', 'kind', 'playful'],
    appearance: {
      bodies: ['round'], eyes: ['sleepy', 'sparkle', 'sharp'], ears: ['pointed', 'round'], tails: ['thin'],
      markings: ['stripes', 'socks', 'none', 'blaze', 'spots'],
      palettes: [
        { name: 'Charcoal',  primary: '#57516F', secondary: '#9C95B5', marking: '#38334D' },
        { name: 'Marmalade', primary: '#E6B06E', secondary: '#FFF3DC', marking: '#C58A45' },
        { name: 'Storm',     primary: '#8FA3BF', secondary: '#E6EEF8', marking: '#61779A' },
        { name: 'Cream',     primary: '#F0DFC6', secondary: '#FFFFFF', marking: '#C9B08A' },
      ],
    },
    evolution: { familyId: 'cat', stage: 1, evolvesTo: [] },
  },
  {
    id: 'dog', name: 'Dog',
    description: 'Loyal to the bone and delighted to see you.',
    baseStats: { vitality: 12, strength: 11, agility: 9, intellect: 9, charm: 12 },
    elements: ['earth', 'fire', 'nature', 'light', 'water'],
    personalities: ['kind', 'brave', 'playful', 'adventurous', 'lazy', 'curious'],
    appearance: {
      bodies: ['plump'], eyes: ['round', 'sparkle', 'sleepy'], ears: ['floppy', 'round'], tails: ['curled'],
      markings: ['spots', 'blaze', 'socks', 'none', 'freckles'],
      palettes: [
        { name: 'Biscuit', primary: '#D7AA74', secondary: '#FFF0D6', marking: '#A87A47' },
        { name: 'Cocoa',   primary: '#8F674C', secondary: '#F0DCC4', marking: '#5F4130' },
        { name: 'Cloud',   primary: '#EFEAF4', secondary: '#FFFFFF', marking: '#B7AECB' },
        { name: 'Slate',   primary: '#7F8AA3', secondary: '#E3E8F2', marking: '#56607A' },
      ],
    },
    evolution: { familyId: 'dog', stage: 1, evolvesTo: [] },
  },
  {
    id: 'rabbit', name: 'Rabbit',
    description: 'Soft-footed, quick to startle, quicker to forgive.',
    baseStats: { vitality: 9, strength: 6, agility: 13, intellect: 10, charm: 13 },
    elements: ['nature', 'wind', 'earth', 'light', 'water'],
    personalities: ['shy', 'kind', 'curious', 'playful', 'lazy'],
    appearance: {
      bodies: ['round'], eyes: ['round', 'sparkle', 'sleepy'], ears: ['long'], tails: ['puff'],
      markings: ['freckles', 'star', 'none', 'spots', 'blaze'],
      palettes: [
        { name: 'Cloud', primary: '#F1ECF6', secondary: '#FFD7E2', marking: '#C8BCDA' },
        { name: 'Fawn',  primary: '#CDA98A', secondary: '#FFF1E4', marking: '#9C7659' },
        { name: 'Sage',  primary: '#A9C7A4', secondary: '#F0F8EC', marking: '#78A072' },
        { name: 'Lilac', primary: '#C7B2E6', secondary: '#F5EEFF', marking: '#9479C4' },
      ],
    },
    evolution: { familyId: 'rabbit', stage: 1, evolvesTo: [] },
  },
  {
    id: 'wolf', name: 'Wolf',
    description: 'Quiet, watchful, fiercely devoted to its pack of one.',
    baseStats: { vitality: 11, strength: 13, agility: 11, intellect: 10, charm: 8 },
    elements: ['shadow', 'wind', 'earth', 'light', 'water'],
    personalities: ['brave', 'adventurous', 'kind', 'shy', 'mischievous'],
    appearance: {
      bodies: ['slim'], eyes: ['sharp', 'round', 'sparkle'], ears: ['tall'], tails: ['bushy'],
      markings: ['blaze', 'stripes', 'socks', 'none', 'star'],
      palettes: [
        { name: 'Moonstone', primary: '#9AA5BE', secondary: '#E7ECF6', marking: '#6C7896' },
        { name: 'Timber',    primary: '#82758C', secondary: '#D9D0E2', marking: '#5A4E66' },
        { name: 'Night',     primary: '#57548A', secondary: '#A29ECF', marking: '#38356A' },
        { name: 'Frost',     primary: '#DDE6F2', secondary: '#FFFFFF', marking: '#A4B4CC' },
      ],
    },
    evolution: { familyId: 'wolf', stage: 1, evolvesTo: [] },
  },
  {
    id: 'slime', name: 'Slime',
    description: 'Squishy, cheerful, and somehow always a little warm.',
    baseStats: { vitality: 13, strength: 7, agility: 8, intellect: 10, charm: 12 },
    elements: ['water', 'nature', 'light', 'shadow', 'earth'],
    personalities: ['playful', 'lazy', 'curious', 'kind', 'shy'],
    appearance: {
      bodies: ['blob'], eyes: ['round', 'sparkle', 'sleepy'], ears: ['none'], tails: ['none'],
      markings: ['none', 'spots', 'star', 'freckles'],
      palettes: [
        { name: 'Dew',   primary: '#8FD5E8', secondary: '#D9F6FF', marking: '#5AAAC4' },
        { name: 'Moss',  primary: '#A9DB8A', secondary: '#EAF9D9', marking: '#77B457' },
        { name: 'Berry', primary: '#E58DB8', secondary: '#FFDDEC', marking: '#BF5F8D' },
        { name: 'Amber', primary: '#F2C368', secondary: '#FFF0C7', marking: '#CC9A3A' },
        { name: 'Void',  primary: '#7F70C6', secondary: '#D4C9F5', marking: '#54479B' },
      ],
    },
    evolution: { familyId: 'slime', stage: 1, evolvesTo: [] },
  },
];

export const SPECIES: Record<SpeciesId, SpeciesDefinition> = Object.fromEntries(
  DEFINITIONS.map((s) => [s.id, s]),
);

export function getSpecies(id: SpeciesId): SpeciesDefinition {
  const species = SPECIES[id];
  if (!species) throw new Error(`Unknown species: ${id}`);
  return species;
}
