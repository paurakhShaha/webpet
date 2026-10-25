import { useMemo } from 'react';
import type { Pet } from '@/types';
import { simulatePet } from '@/game/simulation';

/**
 * The pet as it is *right now*: the saved pet moved forward by the time that has passed.
 * Display only — no timer writes to storage. Saving happens on open and on each action.
 */
export function useLivePet(pet: Pet | null, now: number): Pet | null {
  return useMemo(() => (pet ? simulatePet(pet, now).pet : null), [pet, now]);
}
