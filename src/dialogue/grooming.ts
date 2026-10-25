import { line } from './types';

export const GROOMING = [
  line('grooming', 'That feels nice.'),
  line('grooming', 'Ahh, right there.'),
  line('grooming', 'All clean!'),
  line('grooming', 'You always know how to make me feel better.', { minFriendship: 60 }),
  line('grooming', 'O-oh\u2026 that\u2019s nice.', { personality: 'shy' }),
  line('grooming', 'Careful, I\u2019m ticklish!', { personality: 'mischievous' }),
  line('grooming', 'Please never stop.', { personality: 'lazy' }),
  line('grooming', 'Do I look brave and handsome now?', { personality: 'brave' }),
  line('grooming', 'What\u2019s that tool for?', { personality: 'curious' }),
  line('grooming', 'Ready for a new adventure!', { personality: 'adventurous' }),
  line('grooming', 'Now I sparkle!', { personality: 'playful' }),
  line('grooming', 'Thank you for taking care of me.', { personality: 'kind' }),
];
