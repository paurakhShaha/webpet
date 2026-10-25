import type { LocationDefinition, WorldNow } from '@/types';
import { getItem } from '@/inventory/catalog';
import { SEASON_LABEL, WEATHER_LABEL } from '@/world/clock';

/** Short hints about how the world right now changes this place. */
export function worldNotes(loc: LocationDefinition, world: WorldNow): string[] {
  const notes: string[] = [];
  if (loc.enemyTypes.some((e) => e.time?.includes('night'))) {
    notes.push(world.time === 'night' ? 'Night creatures are out here after dark.' : 'Some creatures here only come out at night.');
  }
  for (const d of loc.rewardTable.drops) {
    const boost = d.boost?.weather?.[world.weather];
    if (boost && boost > 1.2) notes.push(`${WEATHER_LABEL[world.weather]} makes ${getItem(d.item).name} easier to find.`);
    if (d.season?.includes(world.season)) notes.push(`${SEASON_LABEL[world.season]} collectibles can be found here.`);
  }
  if (world.weather === 'fog') notes.push('Fog can hide mysterious encounters.');
  return [...new Set(notes)].slice(0, 3);
}
