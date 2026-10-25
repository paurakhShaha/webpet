import {
  Backpack, BookOpen, Compass, Droplet, Eye, Flame, Hand, Hourglass, Leaf, Moon, Mountain,
  PawPrint, Sun, Wind, Gem, Store, Swords, type LucideIcon,
} from 'lucide-react';
import type { EggAction, ElementId } from '@/types';
import type { NavId } from '@/game/navigation';

export const ELEMENT_ICONS: Record<ElementId, LucideIcon> = {
  fire: Flame, water: Droplet, earth: Mountain, wind: Wind, light: Sun, shadow: Moon, nature: Leaf,
};

export const ACTION_ICONS: Record<EggAction, LucideIcon> = {
  tap: Hand, observe: Eye, incubate: Flame, wait: Hourglass,
};

export const NAV_ICONS: Record<NavId, LucideIcon> = {
  pet: PawPrint, adventure: Compass, inventory: Backpack, equipment: Swords, quests: ScrollText, shop: Store, journal: BookOpen,
};

import {
  Apple, Axe, Bird, Cherry, CircleDot, Clover, Coins, Crown, Diamond, Droplets, Drumstick, Fish, FlaskConical, Flower2, Footprints, Ghost,
  HeartPulse, Landmark, Pickaxe, Puzzle, Ribbon, ScrollText, Shield, ShieldPlus, Shirt, Sparkles, Star, Sword, TreePine, WandSparkles,
  Heart, Map as MapIcon, Medal, TrendingUp, Utensils,
} from 'lucide-react';

const LOCATION_ICON_MAP: Record<string, LucideIcon> = { 'tree-pine': TreePine, pickaxe: Pickaxe, landmark: Landmark };
const ENEMY_ICON_MAP: Record<string, LucideIcon> = { droplets: Droplets, bird: Bird, 'paw-print': PawPrint, axe: Axe, ghost: Ghost };
const ITEM_ICON_MAP: Record<string, LucideIcon> = {
  'tree-pine': TreePine, leaf: Leaf, moon: Moon, gem: Gem, mountain: Mountain, diamond: Diamond, sparkles: Sparkles,
  star: Star, coins: Coins, 'scroll-text': ScrollText, puzzle: Puzzle, sun: Sun,
  apple: Apple, cherry: Cherry, drumstick: Drumstick, fish: Fish, sword: Sword, wand: WandSparkles, shirt: Shirt, shield: Shield,
  'shield-plus': ShieldPlus, footprints: Footprints, 'circle-dot': CircleDot, clover: Clover, 'heart-pulse': HeartPulse, ribbon: Ribbon,
  flower: Flower2, crown: Crown, flask: FlaskConical,
};

const ACHIEVEMENT_ICON_MAP: Record<string, LucideIcon> = {
  footprints: Footprints, compass: Compass, 'trending-up': TrendingUp, utensils: Utensils, crown: Crown, gem: Gem,
  backpack: Backpack, map: MapIcon, medal: Medal, heart: Heart, sparkles: Sparkles,
};
export const achievementIcon = (key: string): LucideIcon => ACHIEVEMENT_ICON_MAP[key] ?? Star;

export const locationIcon = (key: string): LucideIcon => LOCATION_ICON_MAP[key] ?? Compass;
export const enemyIcon = (key: string): LucideIcon => ENEMY_ICON_MAP[key] ?? PawPrint;
export const itemIcon = (key: string): LucideIcon => ITEM_ICON_MAP[key] ?? Gem;
