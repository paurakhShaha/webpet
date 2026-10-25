import type { Mood, Pet, TimeOfDay } from '@/types';
import { CARE_CONFIG as C } from './careConfig';

export function getMood(pet: Pet): Mood {
  if (pet.sleep) return 'sleeping';
  if (pet.hunger < C.decay.lowThreshold) return 'hungry';
  if (pet.energy < C.decay.lowThreshold) return 'tired';
  if (pet.happiness < 30) return 'sad';
  if (pet.happiness >= 70) return 'happy';
  return 'content';
}

export function timeOfDay(now: number): TimeOfDay {
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
