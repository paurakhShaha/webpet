import { line } from './types';

export const NEEDS = [
  line('need-hungry', 'My tummy is rumbling\u2026'),
  line('need-hungry', 'Is it snack time?'),
  line('need-hungry', 'I could really go for a berry.'),
  line('need-hungry', 'I\u2019m so hungry I could eat a whole apple. Maybe two.', { personality: ['playful', 'lazy'] }),
  line('need-hungry', 'Not to complain, but\u2026 food?', { personality: 'shy' }),

  line('need-tired', '*yawn*'),
  line('need-tired', 'I could really use a nap.'),
  line('need-tired', 'My eyes keep closing\u2026'),
  line('need-tired', 'Nap time is the best time.', { personality: 'lazy' }),

  line('need-sad', 'It\u2019s been a little lonely.'),
  line('need-sad', 'Could we do something together?'),
  line('need-sad', 'Do you have a minute?', { minFriendship: 20 }),
  line('need-sad', 'I\u2019m fine\u2026 mostly.', { personality: 'shy' }),
];
