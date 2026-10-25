import { createRng } from '@/utils/rng';

const SUGGESTED_NAMES = [
  'Pip', 'Juniper', 'Mochi', 'Ember', 'Nova', 'Biscuit', 'Willow', 'Comet', 'Poppy', 'Sage',
  'Clover', 'Maple', 'Pebble', 'Tansy', 'Bramble', 'Lumen', 'Hazel', 'Ollie', 'Wren', 'Fable',
  'Marlow', 'Dusk', 'Cinder', 'Basil', 'Nimbus', 'Tuck', 'Ivy', 'Rowan', 'Moss', 'Twig',
];

/** A stable suggestion for a given pet id; bump `attempt` for another. */
export function suggestName(seed: string, attempt: number): string {
  return createRng(`${seed}::name::${attempt}`).pick(SUGGESTED_NAMES);
}
