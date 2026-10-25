import { line } from './types';

export const FEEDING = [
  line('feeding', 'Yum!'),
  line('feeding', 'Delicious!'),
  line('feeding', 'More, please!'),
  line('feeding', 'Mmm, {food}!'),
  line('feeding', 'Thank you!', { minFriendship: 20 }),
  line('feeding', 'You always know what I want.', { minFriendship: 60 }),
  line('feeding', 'Fuel for adventure!', { personality: ['brave', 'adventurous'] }),
  line('feeding', 'Food, delivered right to me. Perfect.', { personality: 'lazy' }),
  line('feeding', 'I definitely didn\u2019t steal your food. This one\u2019s mine anyway.', { personality: 'mischievous' }),
  line('feeding', 'What is this? \u2026Oh, it\u2019s good.', { personality: 'curious' }),
  line('feeding', 'Th-thank you\u2026', { personality: 'shy' }),
  line('feeding', 'Would you like a bite?', { personality: 'kind' }),
  line('feeding', 'Nom nom nom!', { personality: 'playful' }),

  line('feeding-favorite', 'My favourite! You remembered!'),
  line('feeding-favorite', '{food}! Best thing ever!'),
  line('feeding-favorite', 'This is the good stuff.', { minFriendship: 40 }),

  line('feeding-starving', 'Finally! I was so hungry!'),
  line('feeding-starving', 'Thank goodness. My tummy was so loud.'),
  line('feeding-starving', 'I could hug you right now.', { minFriendship: 40 }),

  line('feeding-full', 'I\u2019m too full right now.'),
  line('feeding-full', 'Maybe later \u2014 I couldn\u2019t fit another bite.'),
  line('feeding-full', 'Too full to chew\u2026', { personality: 'lazy' }),
  line('feeding-full', 'Save it for later. For me. Not for you.', { personality: 'mischievous' }),
];
