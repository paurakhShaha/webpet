import type { QuestDefinition } from '@/types';

/**
 * ADD A QUEST: append here. Objectives read lifetime counters (see progression/track.ts), so no extra code is needed.
 * Counters: adventures, adventures:<location>, enemies, treasures, materials, feeds, plays, grooms, pets, care,
 * purchases, sales, gold-earned, gold-spent, levelups, equips.
 */
export const QUESTS: QuestDefinition[] = [
  // ── Story: a gentle chain that also teaches the game ──
  {
    id: 'story-welcome', type: 'story', title: 'A Warm Welcome',
    description: 'Your new friend is settling in. Show them a little kindness.',
    objectives: [{ metric: 'feeds', target: 1, label: 'Feed your pet' }, { metric: 'pets', target: 1, label: 'Give them a pat' }],
    reward: { gold: 40, xp: 10, items: [{ item: 'apple', qty: 2 }] },
  },
  {
    id: 'story-first-journey', type: 'story', title: 'Out the Door', requires: ['story-welcome'],
    description: 'The world is bigger than the garden. Send your pet on a short adventure.',
    objectives: [{ metric: 'adventures', target: 1, label: 'Complete an adventure' }],
    reward: { gold: 50, xp: 20, items: [{ item: 'rusty-sword', qty: 1 }] },
  },
  {
    id: 'story-gear-up', type: 'story', title: 'Dressed for the Part', requires: ['story-first-journey'],
    description: 'You earned a Rusty Sword. Open the Equipment screen and put it on.',
    objectives: [{ metric: 'equips', target: 1, label: 'Equip an item' }],
    reward: { gold: 30, xp: 15, items: [{ item: 'four-leaf-charm', qty: 1 }] },
  },
  {
    id: 'story-strange-light', type: 'story', title: 'The Strange Light', requires: ['story-gear-up'],
    description: 'A strange light has appeared beyond the forest. Something is stirring in the old ruins.',
    objectives: [{ metric: 'adventures:whispering-forest', target: 3, label: 'Complete 3 Forest adventures' }],
    reward: { gold: 150, xp: 60, flag: 'ruins-open', flagText: 'The path to the Ancient Ruins is open.' },
  },
  {
    id: 'story-whispers', type: 'story', title: 'Whispers in the Stone', requires: ['story-strange-light'], requiresFlag: 'ruins-open', minLevel: 12,
    description: 'The light came from the ruins. Something old is waiting there, and it seems friendly.',
    objectives: [{ metric: 'adventures:ancient-ruins', target: 1, label: 'Complete an Ancient Ruins adventure' }],
    reward: { gold: 500, xp: 300, items: [{ item: 'sun-charm', qty: 1 }] },
  },

  {
    id: 'story-falling-stars', type: 'story', title: 'The Falling Stars', requires: ['story-whispers'], minLevel: 20,
    description: 'Stars have started falling at night. Someone should find out why, and the Old Explorer says it\u2019s you.',
    objectives: [{ metric: 'events:meteor', target: 2, label: 'Investigate 2 fallen meteors' }],
    reward: { gold: 800, xp: 500, items: [{ item: 'meteor-shard', qty: 1 }], flag: 'rift-open', flagText: 'A seam opens in the sky: the Cosmic Rift.' },
  },

  // ── Exploration ──
  {
    id: 'explore-forest', type: 'exploration', title: 'Forest Wanderer',
    description: 'Get to know every path of the Whispering Forest.',
    objectives: [{ metric: 'adventures:whispering-forest', target: 5, label: 'Complete 5 Forest adventures' }],
    reward: { gold: 80, xp: 30 },
  },
  {
    id: 'explore-treasure', type: 'exploration', title: 'Lucky Find', minLevel: 2,
    description: 'Somewhere out there is a treasure with your pet\u2019s name on it.',
    objectives: [{ metric: 'treasures', target: 1, label: 'Find a rare treasure' }],
    reward: { gold: 100, xp: 40, items: [{ item: 'moon-pendant', qty: 1 }] },
  },
  {
    id: 'explore-mine', type: 'exploration', title: 'Into the Glittering Dark', minLevel: 5,
    description: 'The Crystal Mine is full of surprises. Bring a lantern.',
    objectives: [{ metric: 'adventures:crystal-mine', target: 3, label: 'Complete 3 Crystal Mine adventures' }],
    reward: { gold: 200, xp: 120, items: [{ item: 'glowstone', qty: 2 }] },
  },
  {
    id: 'explore-ruins', type: 'exploration', title: 'Old Stones', requiresFlag: 'ruins-open', minLevel: 12,
    description: 'Learn what the ruins remember.',
    objectives: [{ metric: 'adventures:ancient-ruins', target: 3, label: 'Complete 3 Ancient Ruins adventures' }],
    reward: { gold: 600, xp: 400, items: [{ item: 'relic-shard', qty: 1 }] },
  },

  {
    id: 'explore-coast', type: 'exploration', title: 'Under the Lanterns', minLevel: 16, requiresFlag: 'disc:tide-chart',
    description: 'The Sunken Coast keeps its lights on. Find out why.',
    objectives: [{ metric: 'adventures:sunken-cove', target: 3, label: 'Complete 3 Sunken Cove adventures' }],
    reward: { gold: 700, xp: 450, items: [{ item: 'pearl', qty: 2 }] },
  },
  {
    id: 'explore-peaks', type: 'exploration', title: 'Warm Rock, Cold Air', minLevel: 22,
    description: 'Climb Ember Ridge and see what the dragons are up to.',
    objectives: [{ metric: 'adventures:ember-ridge', target: 3, label: 'Complete 3 Ember Ridge adventures' }],
    reward: { gold: 1100, xp: 700, items: [{ item: 'dragon-scale', qty: 3 }] },
  },
  {
    id: 'explore-curious', type: 'exploration', title: 'Curious Mind', minLevel: 2,
    description: 'The world hides things. Keep looking.',
    objectives: [{ metric: 'discoveries', target: 5, label: 'Make 5 discoveries' }],
    reward: { gold: 150, xp: 80, items: [{ item: 'strange-compass', qty: 1 }] },
  },
  {
    id: 'night-whispers', type: 'exploration', title: 'Night Whispers', minLevel: 3, when: { time: ['night'] },
    description: 'Some things only happen after dark. This quest only appears at night.',
    objectives: [{ metric: 'adventures:time:night', target: 1, label: 'Set out on an adventure at night' }],
    reward: { gold: 80, xp: 40, items: [{ item: 'moon-mushroom', qty: 2 }] },
  },
  {
    id: 'rainy-herbs', type: 'exploration', title: 'Rainy Day Herbs', minLevel: 2, when: { weather: ['rain'] },
    description: 'The rain brings the herbs out. Thistle would love some. This quest appears when it rains.',
    objectives: [{ metric: 'collected:healing-herb', target: 5, label: 'Collect 5 Healing Herbs' }],
    reward: { gold: 90, xp: 40, items: [{ item: 'rainbloom', qty: 1 }] },
  },

  // ── Secret quests (found by exploring) ──
  {
    id: 'secret-explorers-note', type: 'exploration', title: 'The Folded Note', secret: true, requiresFlag: 'disc:explorers-note', minLevel: 3,
    description: 'A muddy note mentions a place that is only visible after dark. Maybe the forest at night?',
    objectives: [{ metric: 'adventures:time:night', target: 2, label: 'Explore at night twice' }],
    reward: { gold: 200, xp: 90, items: [{ item: 'lantern-feather', qty: 2 }] },
  },
  {
    id: 'secret-bottle', type: 'exploration', title: 'Message in a Bottle', secret: true, requiresFlag: 'disc:message-in-a-bottle', minLevel: 16,
    description: 'The message asks for help finding a lost lantern keeper. Search the cove.',
    objectives: [{ metric: 'adventures:sunken-cove', target: 2, label: 'Search the Sunken Cove twice' }],
    reward: { gold: 600, xp: 300, items: [{ item: 'pearl-necklace', qty: 1 }] },
  },

  // ── NPC requests ──
  {
    id: 'npc-merchant-1', type: 'exploration', title: 'Mossy\u2019s Request', giver: 'village-merchant', requiresFlag: 'met:village-merchant', minLevel: 2,
    description: 'Mossy says the best customers are the ones who spend a little. Spend some gold in the shop.',
    objectives: [{ metric: 'gold-spent', target: 100, label: 'Spend 100 gold' }],
    reward: { gold: 60, xp: 30, items: [{ item: 'flower-clip', qty: 1 }] },
  },
  {
    id: 'npc-smith-1', type: 'exploration', title: 'Iron for the Forge', giver: 'blacksmith', requiresFlag: 'met:blacksmith', minLevel: 5,
    description: 'Brannoch is running low on iron ore. Bring some back from the Crystal Mine.',
    objectives: [{ metric: 'collected:iron-ore', target: 10, label: 'Collect 10 Iron Ore' }],
    reward: { gold: 150, xp: 70, items: [{ item: 'iron-blade', qty: 1 }] },
  },
  {
    id: 'npc-potion-1', type: 'exploration', title: 'Herbs for Thistle', giver: 'potion-maker', requiresFlag: 'met:potion-maker', minLevel: 2,
    description: 'Thistle needs fresh herbs. Healing herb goes in last, always last.',
    objectives: [{ metric: 'collected:healing-herb', target: 6, label: 'Collect 6 Healing Herbs' }],
    reward: { gold: 80, xp: 40, items: [{ item: 'energy-tonic', qty: 1 }, { item: 'luck-tonic', qty: 1 }] },
  },
  {
    id: 'npc-explorer-1', type: 'exploration', title: 'The Explorer\u2019s Request', giver: 'old-explorer', requiresFlag: 'met:old-explorer', minLevel: 3,
    description: 'Old Wren wants a second set of eyes. Go out and find some things worth finding.',
    objectives: [{ metric: 'discoveries', target: 3, label: 'Make 3 discoveries' }],
    reward: { gold: 180, xp: 100 },
  },
  {
    id: 'npc-traveler-1', type: 'exploration', title: 'A Favour for the Traveler', giver: 'mystery-traveler', requiresFlag: 'met:mystery-traveler', minLevel: 6,
    description: 'The Traveler wants to know what lives in the dark places. Say hello to a few of them.',
    objectives: [{ metric: 'defeated:wraith', target: 3, label: 'Defeat 3 Wraiths' }],
    reward: { gold: 400, xp: 220, items: [{ item: 'dream-tonic', qty: 1 }] },
  },

  // ── Long-term goals ──
  {
    id: 'goal-veteran', type: 'achievement', title: 'Veteran Adventurer', minLevel: 3,
    description: 'A long road, one trip at a time.',
    objectives: [{ metric: 'adventures', target: 25, label: 'Complete 25 adventures' }],
    reward: { gold: 400, xp: 150, items: [{ item: 'glow-ring', qty: 1 }] },
  },
  {
    id: 'goal-rich', type: 'achievement', title: 'Pocketful of Gold', minLevel: 3,
    description: 'Save, sell, and spend wisely.',
    objectives: [{ metric: 'gold-earned', target: 1000, label: 'Earn 1,000 gold in total' }],
    reward: { xp: 100, items: [{ item: 'energy-tonic', qty: 2 }] },
  },

  // ── Daily pool (3 are picked each day) ──
  { id: 'daily-feed', type: 'daily', title: 'Snack Time', description: 'A little food goes a long way.', objectives: [{ metric: 'feeds', target: 2, label: 'Feed your pet 2 times' }], reward: { gold: 20, items: [{ item: 'berry', qty: 1 }] } },
  { id: 'daily-play', type: 'daily', title: 'Playtime', description: 'Make some time to play.', objectives: [{ metric: 'plays', target: 1, label: 'Play together' }], reward: { gold: 25, xp: 6 } },
  { id: 'daily-groom', type: 'daily', title: 'Spruce Up', description: 'A quick brush does wonders.', objectives: [{ metric: 'grooms', target: 1, label: 'Groom your pet' }], reward: { gold: 20, xp: 8 } },
  { id: 'daily-pet', type: 'daily', title: 'Pat Pat', description: 'Pets love attention.', objectives: [{ metric: 'pets', target: 3, label: 'Pet your pet 3 times' }], reward: { gold: 15, items: [{ item: 'apple', qty: 1 }] } },
  { id: 'daily-adventure', type: 'daily', title: 'A Short Trip', description: 'Fresh air, new sights.', objectives: [{ metric: 'adventures', target: 1, label: 'Complete an adventure' }], reward: { gold: 40, xp: 15 } },
  { id: 'daily-forest', type: 'daily', title: 'Forest Errands', description: 'The forest always has something to do.', objectives: [{ metric: 'adventures:whispering-forest', target: 2, label: 'Complete 2 Forest adventures' }], reward: { gold: 100, xp: 20, items: [{ item: 'berry', qty: 1 }] } },
  { id: 'daily-mine', type: 'daily', title: 'Mining Run', minLevel: 5, description: 'A quick delve into the Crystal Mine.', objectives: [{ metric: 'adventures:crystal-mine', target: 1, label: 'Complete a Crystal Mine adventure' }], reward: { gold: 90, xp: 40 } },
  { id: 'daily-collect', type: 'daily', title: 'Gatherer', minLevel: 2, description: 'Bring home some useful materials.', objectives: [{ metric: 'materials', target: 6, label: 'Collect 6 materials' }], reward: { gold: 30, xp: 10 } },

  // ── Weekly pool (2 are picked each week) ──
  { id: 'weekly-explorer', type: 'weekly', title: 'Busy Week', minLevel: 2, description: 'Keep the adventures coming.', objectives: [{ metric: 'adventures', target: 8, label: 'Complete 8 adventures' }], reward: { gold: 300, xp: 100, items: [{ item: 'energy-tonic', qty: 1 }] } },
  { id: 'weekly-caretaker', type: 'weekly', title: 'Devoted Friend', description: 'Be there for your pet.', objectives: [{ metric: 'care', target: 15, label: 'Feed, play or groom 15 times' }], reward: { gold: 150, xp: 60, items: [{ item: 'apple', qty: 3 }] } },
  { id: 'weekly-treasure', type: 'weekly', title: 'Treasure Week', minLevel: 3, description: 'Fortune favours the curious.', objectives: [{ metric: 'treasures', target: 2, label: 'Find 2 rare treasures' }], reward: { gold: 250, xp: 80, items: [{ item: 'luck-tonic', qty: 1 }] } },
  { id: 'weekly-hunter', type: 'weekly', title: 'Monster Watch', minLevel: 2, description: 'Keep the trails safe.', objectives: [{ metric: 'enemies', target: 30, label: 'Defeat 30 enemies' }], reward: { gold: 200, xp: 90 } },
];

export const getQuest = (id: string): QuestDefinition | undefined => QUESTS.find((q) => q.id === id);

export const QUEST_TYPE_LABEL = { daily: 'Daily', weekly: 'Weekly', story: 'Story', exploration: 'Exploration', achievement: 'Goals' } as const;
