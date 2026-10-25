import type { GameState, LocationDefinition, Pet } from '@/types';
import { getQuest } from '@/quests/definitions';
import { QUESTS } from '@/quests/definitions';

/** Why a place is closed, in words. Null when it's open. */
export function lockReason(game: GameState, pet: Pet, loc: LocationDefinition): string | null {
  const needsStory = loc.requiresFlag && !game.progress.flags.includes(loc.requiresFlag);
  if (needsStory) {
    const quest = QUESTS.find((q) => q.reward.flag === loc.requiresFlag);
    return quest ? `Finish the story quest \u201c${getQuest(quest.id)!.title}\u201d` : 'Opens later in the story';
  }
  if (pet.level < loc.minimumLevel) return `Unlocks at level ${loc.minimumLevel}`;
  return null;
}
