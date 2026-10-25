import type { JournalState, WorldState } from '@/types';
import { createRng } from '@/utils/rng';

export const emptyWorld = (seedSource: string): WorldState => ({
  seed: createRng(`world:${seedSource}`).fork('seed').seed,
  seasonMode: 'auto',
  eventsDone: [],
  eventPurchases: {},
  regionsSeen: [],
});

export const emptyJournal = (): JournalState => ({ entries: [], keys: [] });
