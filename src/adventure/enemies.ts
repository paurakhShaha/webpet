import type { EnemyDefinition, EnemyId } from '@/types';

/** ADD AN ENEMY: append here, then list it in a location's `enemyTypes`. */
export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
  slime: { id: 'slime', name: 'Slime', description: 'Wobbly and surprisingly polite.', hp: 26, attack: 6, defense: 2, speed: 4, xp: 5, gold: 14, icon: 'droplets' },
  bat: { id: 'bat', name: 'Bat', description: 'Fast, flappy and easily startled.', hp: 18, attack: 8, defense: 1, speed: 14, xp: 6, gold: 18, icon: 'bird' },
  wolf: { id: 'wolf', name: 'Wolf', description: 'Wary and strong, but not unkind.', hp: 38, attack: 11, defense: 4, speed: 11, xp: 8, gold: 26, icon: 'paw-print' },
  goblin: { id: 'goblin', name: 'Goblin', description: 'Carries more than it can use.', hp: 44, attack: 13, defense: 6, speed: 8, xp: 11, gold: 34, icon: 'axe' },
  'forest-spirit': { id: 'forest-spirit', name: 'Forest Spirit', description: 'A drifting light that hits with magic.', hp: 52, attack: 14, defense: 5, speed: 10, xp: 14, gold: 40, magical: true, icon: 'ghost' },

  // Night creatures
  'moon-moth': { id: 'moon-moth', name: 'Moon Moth', description: 'Drawn to anything that glows. Only comes out at night.', hp: 20, attack: 9, defense: 1, speed: 13, xp: 7, gold: 20, icon: 'bug' },
  shade: { id: 'shade', name: 'Shade', description: 'A patch of darkness that moves on its own.', hp: 40, attack: 12, defense: 3, speed: 12, xp: 12, gold: 32, magical: true, icon: 'ghost' },
  wraith: { id: 'wraith', name: 'Wraith', description: 'An old guardian that has forgotten what it guards.', hp: 55, attack: 15, defense: 4, speed: 11, xp: 16, gold: 44, magical: true, icon: 'skull' },
  // Sunken Coast
  'sea-crab': { id: 'sea-crab', name: 'Sea Crab', description: 'Armoured, grumpy, and surprisingly fast sideways.', hp: 48, attack: 11, defense: 9, speed: 5, xp: 11, gold: 30, icon: 'shell' },
  'tide-wisp': { id: 'tide-wisp', name: 'Tide Wisp', description: 'A bobbing light that lures sailors off course.', hp: 42, attack: 13, defense: 3, speed: 12, xp: 13, gold: 36, magical: true, icon: 'waves' },
  'kelp-lurker': { id: 'kelp-lurker', name: 'Kelp Lurker', description: 'Mostly seaweed. Not entirely seaweed.', hp: 60, attack: 12, defense: 6, speed: 6, xp: 14, gold: 40, icon: 'fish' },
  // Dragon Peaks
  'ember-imp': { id: 'ember-imp', name: 'Ember Imp', description: 'Small, hot-tempered, and always grinning.', hp: 36, attack: 15, defense: 3, speed: 14, xp: 14, gold: 40, icon: 'flame' },
  'rock-golem': { id: 'rock-golem', name: 'Rock Golem', description: 'Slow, patient and very, very hard.', hp: 80, attack: 13, defense: 12, speed: 3, xp: 18, gold: 50, icon: 'mountain' },
  'drake-whelp': { id: 'drake-whelp', name: 'Drake Whelp', description: 'A young dragon who thinks it is bigger than it is.', hp: 62, attack: 16, defense: 7, speed: 10, xp: 20, gold: 58, icon: 'bird' },
  // Cosmic Rift
  'star-wisp': { id: 'star-wisp', name: 'Star Wisp', description: 'A scrap of starlight with opinions.', hp: 44, attack: 16, defense: 3, speed: 14, xp: 18, gold: 54, magical: true, icon: 'sparkles' },
  'void-hound': { id: 'void-hound', name: 'Void Hound', description: 'It runs between the spaces in the sky.', hp: 64, attack: 17, defense: 7, speed: 15, xp: 22, gold: 66, icon: 'dog' },
  'rift-stalker': { id: 'rift-stalker', name: 'Rift Stalker', description: 'It watches. Mostly it watches.', hp: 78, attack: 19, defense: 9, speed: 11, xp: 28, gold: 80, magical: true, icon: 'eye' },
};

export const getEnemy = (id: EnemyId): EnemyDefinition => ENEMIES[id];
