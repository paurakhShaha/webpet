import type { Interaction } from '@/game/careActions';

/** Pages can't write to WebPet's save directly; they ask the background worker, which owns the lock. */
export const PET_MESSAGE = 'webpet:pet';
export interface PetMessageResponse {
  interaction: Interaction | null;
}
