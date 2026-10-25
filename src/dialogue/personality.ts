import { line } from './types';

/** Things each personality says now and then (speech bubbles while roaming). */
export const PERSONALITY_LINES = [
  line('ambient', 'Let\u2019s explore!', { personality: 'brave' }),
  line('ambient', 'I\u2019m not afraid of anything. Almost anything.', { personality: 'brave' }),
  line('ambient', 'What\u2019s that?', { personality: 'curious' }),
  line('ambient', 'Why do you think links are blue?', { personality: 'curious' }),
  line('ambient', 'Can we do that tomorrow?', { personality: 'lazy' }),
  line('ambient', 'This spot is perfect for a nap.', { personality: 'lazy' }),
  line('ambient', 'I definitely didn\u2019t steal your food.', { personality: 'mischievous' }),
  line('ambient', 'I may have moved something. Maybe.', { personality: 'mischievous' }),
  line('ambient', '\u2026are they looking at me?', { personality: 'shy' }),
  line('ambient', 'I\u2019ll just stay over here. Quietly.', { personality: 'shy' }),
  line('ambient', 'Are you okay? You can tell me.', { personality: 'kind' }),
  line('ambient', 'I hope your day is going well.', { personality: 'kind' }),
  line('ambient', 'Wanna play?', { personality: 'playful' }),
  line('ambient', 'Tag! You\u2019re it!', { personality: 'playful' }),
  line('ambient', 'The horizon is calling.', { personality: 'adventurous' }),
  line('ambient', 'There must be something over that scroll bar.', { personality: 'adventurous' }),
  line('ambient', 'Nice day for a wander.'),
  line('ambient', 'Just keeping you company.', { minFriendship: 40 }),
  line('ambient', 'I like it here with you.', { minFriendship: 60, minHappiness: 60 }),
];
