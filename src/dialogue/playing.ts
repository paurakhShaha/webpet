import { line } from './types';

export const PLAYING = [
  line('playing', 'Again, again!'),
  line('playing', 'That was fun!'),
  line('playing', 'You\u2019re fast!', { minFriendship: 20 }),
  line('playing', 'I love playing with you.', { minFriendship: 60 }),
  line('playing', 'I\u2019ll win next time!', { personality: 'brave' }),
  line('playing', 'Okay, but only a little.', { personality: 'lazy' }),
  line('playing', 'Did you see that? Did you see?', { personality: 'playful' }),
  line('playing', 'Oops. That was on purpose.', { personality: 'mischievous' }),
  line('playing', 'How does it bounce like that?', { personality: 'curious' }),
  line('playing', 'Let\u2019s go farther next time!', { personality: 'adventurous' }),
  line('playing', 'That was\u2026 actually really fun.', { personality: 'shy' }),

  line('playing-tired', 'I\u2019m too sleepy to play\u2026'),
  line('playing-tired', 'Can we do that tomorrow?', { personality: 'lazy' }),
  line('playing-tired', 'Just a short nap first, then I\u2019m all yours.', { personality: ['brave', 'adventurous'] }),
  line('playing-tired', 'Let\u2019s rest a little first.', { personality: 'kind' }),

  line('playing-hungry', 'Tummy first, then play?'),
  line('playing-hungry', 'I can\u2019t play on an empty stomach.'),
];
