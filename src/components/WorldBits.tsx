import type { WorldNow } from '@/types';
import { SEASON_LABEL, TIME_LABEL, WEATHER_LABEL } from '@/world/clock';
import { WeatherLayer } from './WorldMap';
import { SEASON_ICONS, TIME_ICONS, WEATHER_ICONS } from './worldIcons';

/** Time of day, weather and season as three small chips. */
export function WorldChips({ world, className = '' }: { world: WorldNow; className?: string }) {
  const chips = [
    { Icon: TIME_ICONS[world.time], label: TIME_LABEL[world.time], what: 'Time of day' },
    { Icon: WEATHER_ICONS[world.weather], label: WEATHER_LABEL[world.weather], what: 'Weather' },
    { Icon: SEASON_ICONS[world.season], label: SEASON_LABEL[world.season], what: 'Season' },
  ];
  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className}`} aria-label="The world right now">
      {chips.map(({ Icon, label, what }) => (
        <li key={what} title={what} className="inline-flex items-center gap-1 rounded-sm bg-surface/90 px-1.5 py-0.5 text-[11px] font-semibold text-text ring-1 ring-border">
          <Icon size={12} className="text-primary-dark" aria-hidden />
          <span className="sr-only">{what}: </span>{label}
        </li>
      ))}
    </ul>
  );
}

/** Night, rain, snow and fog drifting across a stage. Quiet, and still when motion is reduced. */
export function WorldOverlay({ world }: { world: WorldNow }) {
  if (world.time !== 'night' && world.weather === 'clear' && world.time !== 'evening') return null;
  return (
    <svg aria-hidden viewBox="0 0 100 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full opacity-80">
      <WeatherLayer world={world} />
    </svg>
  );
}
