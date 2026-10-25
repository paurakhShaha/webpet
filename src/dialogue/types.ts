import type { Mood, PersonalityId, ReactionId, Season, TimeOfDay, Weather, WorldTime } from '@/types';

export type DialogueCategory =
  | 'greeting' | 'ambient'
  | 'feeding' | 'feeding-favorite' | 'feeding-starving' | 'feeding-full'
  | 'petting'
  | 'playing' | 'playing-tired' | 'playing-hungry'
  | 'grooming'
  | 'sleep-start' | 'sleep-refuse' | 'sleeping-touched' | 'wake' | 'wake-early'
  | 'need-hungry' | 'need-tired' | 'need-sad'
  | 'levelup' | 'friendship-up'
  | 'weather';

/** Every field is optional; a line is eligible only if ALL the fields it sets match. More specific lines are chosen more often. */
export interface DialogueWhen {
  personality?: PersonalityId | PersonalityId[];
  mood?: Mood | Mood[];
  timeOfDay?: TimeOfDay | TimeOfDay[];
  reaction?: ReactionId;
  weather?: Weather | Weather[];
  worldTime?: WorldTime | WorldTime[];
  season?: Season | Season[];
  minFriendship?: number;
  maxFriendship?: number;
  minHappiness?: number;
  maxHappiness?: number;
}

export interface DialogueLine {
  category: DialogueCategory;
  /** Templates: {name}, {food}, {level}, {label}. */
  text: string;
  when?: DialogueWhen;
  weight?: number;
}

export interface DialogueContext {
  name: string;
  personality: PersonalityId;
  mood: Mood;
  happiness: number;
  friendship: number;
  timeOfDay: TimeOfDay;
  reaction?: ReactionId;
  weather?: Weather;
  worldTime?: WorldTime;
  season?: Season;
  vars?: Record<string, string>;
}

/** Tiny authoring helper: `line('feeding', 'Yum!', { personality: 'lazy' })`. */
export const line = (category: DialogueCategory, text: string, when?: DialogueWhen): DialogueLine => ({ category, text, when });
