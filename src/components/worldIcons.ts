import {
  Bird, CloudFog, CloudLightning, CloudRain, CloudSun, Flame, Flower2, Gem, House, Landmark, Leaf, Moon, Mountain, Orbit,
  Pickaxe, ScrollText, Shell, Snowflake, Sun, Sunrise, Sunset, TreePine, Waves, type LucideIcon,
} from 'lucide-react';
import type { Season, Weather, WorldTime } from '@/types';

export const TIME_ICONS: Record<WorldTime, LucideIcon> = { morning: Sunrise, day: Sun, evening: Sunset, night: Moon };
export const WEATHER_ICONS: Record<Weather, LucideIcon> = { clear: CloudSun, rain: CloudRain, storm: CloudLightning, snow: Snowflake, fog: CloudFog };
export const SEASON_ICONS: Record<Season, LucideIcon> = { spring: Flower2, summer: Sun, autumn: Leaf, winter: Snowflake };

const REGION_ICONS: Record<string, LucideIcon> = {
  house: House, 'tree-pine': TreePine, pickaxe: Pickaxe, landmark: Landmark, waves: Waves, mountain: Mountain, orbit: Orbit,
  moon: Moon, gem: Gem, 'scroll-text': ScrollText, shell: Shell, flame: Flame, bird: Bird,
};
export const regionIcon = (key: string): LucideIcon => REGION_ICONS[key] ?? Gem;
