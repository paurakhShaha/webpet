import { line } from './types';

export const SLEEPING = [
  line('sleep-start', 'Goodnight\u2026 zzz.'),
  line('sleep-start', 'Just a little rest\u2026'),
  line('sleep-start', 'Finally.', { personality: 'lazy' }),
  line('sleep-start', 'Thanks for staying with me.', { minFriendship: 40 }),
  line('sleep-start', 'Don\u2019t go anywhere interesting without me\u2026', { personality: ['curious', 'adventurous'] }),

  line('sleep-refuse', 'I\u2019m not tired yet!'),
  line('sleep-refuse', 'Sleep? I\u2019m full of energy!', { personality: ['playful', 'brave'] }),
  line('sleep-refuse', 'Maybe later.', { personality: 'lazy' }),

  line('sleeping-touched', 'Zzz\u2026 mmh\u2026'),
  line('sleeping-touched', '\u2026five more minutes\u2026'),
  line('sleeping-touched', 'Zzz\u2026 \u2026 cheese\u2026'),
  line('sleeping-touched', 'Mm\u2026 you\u2019re warm\u2026', { minFriendship: 40 }),

  line('wake', 'Good morning!'),
  line('wake', 'That was a lovely nap.'),
  line('wake', 'I feel brand new!', { minHappiness: 50 }),
  line('wake', 'I had the best dream.'),
  line('wake', 'Is it dinner yet?', { timeOfDay: 'evening' }),

  line('wake-early', 'Mmh\u2026 already?'),
  line('wake-early', 'I was in the middle of a dream\u2026'),
  line('wake-early', 'Okay, okay, I\u2019m up\u2026', { personality: 'lazy' }),
];
