import type { PersonalityDefinition, PersonalityId } from '@/types';

export const PERSONALITIES: Record<PersonalityId, PersonalityDefinition> = {
  brave:       { id: 'brave',       label: 'Brave',       description: 'Steps forward first and worries later.',       statBonus: { strength: 2, vitality: 1 } },
  curious:     { id: 'curious',     label: 'Curious',     description: 'Has to look at everything at least twice.',    statBonus: { intellect: 2, agility: 1 } },
  playful:     { id: 'playful',     label: 'Playful',     description: 'Turns any quiet moment into a game.',          statBonus: { agility: 2, charm: 1 } },
  shy:         { id: 'shy',         label: 'Shy',         description: 'Takes a while to trust, then never lets go.',  statBonus: { intellect: 1, charm: 2 } },
  lazy:        { id: 'lazy',        label: 'Lazy',        description: 'Believes naps are a form of wisdom.',          statBonus: { vitality: 3 } },
  mischievous: { id: 'mischievous', label: 'Mischievous', description: 'Innocent face, suspicious timing.',            statBonus: { agility: 2, intellect: 1 } },
  kind:        { id: 'kind',        label: 'Kind',        description: 'Notices when you have had a rough day.',       statBonus: { charm: 2, vitality: 1 } },
  adventurous: { id: 'adventurous', label: 'Adventurous', description: 'Already looking at the horizon.',              statBonus: { strength: 1, agility: 2 } },
};

export const PERSONALITY_IDS = Object.keys(PERSONALITIES) as PersonalityId[];
