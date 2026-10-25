import type { GameState, WorldNow } from '@/types';
import { worldAt } from './clock';

export * from './clock';
export * from './regions';
export * from './discoveries';
export * from './explore';
export * from './events';
export * from './npcs';
export * from './apply';
export * from './defaults';

/** The time, weather and season at a moment, for this save's world. */
export const currentWorld = (state: GameState, ts: number): WorldNow => worldAt(state.world, ts);
