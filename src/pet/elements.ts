import type { ElementDefinition, ElementId } from '@/types';

export const ELEMENTS: Record<ElementId, ElementDefinition> = {
  fire:   { id: 'fire',   label: 'Fire',   color: '#E8896B', description: 'Warm-blooded and quick to spark.' },
  water:  { id: 'water',  label: 'Water',  color: '#78B8D0', description: 'Calm on top, deep underneath.' },
  earth:  { id: 'earth',  label: 'Earth',  color: '#B18A6D', description: 'Steady, patient, hard to move.' },
  wind:   { id: 'wind',   label: 'Wind',   color: '#A9D4D0', description: 'Restless and always half-listening.' },
  light:  { id: 'light',  label: 'Light',  color: '#F3D77A', description: 'Glows a little when it is happy.' },
  shadow: { id: 'shadow', label: 'Shadow', color: '#81769F', description: 'Loves dim corners and quiet hours.' },
  nature: { id: 'nature', label: 'Nature', color: '#7FAF8B', description: 'Smells faintly of rain and leaves.' },
};

export const ELEMENT_IDS = Object.keys(ELEMENTS) as ElementId[];
