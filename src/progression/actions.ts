import type { GameState } from '@/types';

export const dismissTip = (state: GameState, id: string): GameState =>
  state.progress.tipsSeen.includes(id) ? state : { ...state, progress: { ...state.progress, tipsSeen: [...state.progress.tipsSeen, id] } };

export const markAchievementsSeen = (state: GameState): GameState =>
  state.progress.unseenAchievements.length ? { ...state, progress: { ...state.progress, unseenAchievements: [] } } : state;
