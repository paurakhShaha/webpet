import { line } from './types';

export const PETTING = [
  line('petting', 'Hehe!', { reaction: 'happy' }),
  line('petting', 'That\u2019s nice.', { reaction: 'happy' }),
  line('petting', 'I love this.', { reaction: 'happy', minFriendship: 60 }),
  line('petting', 'Um\u2026 okay.', { reaction: 'happy', maxFriendship: 19 }),
  line('petting', 'Mm\u2026 sleepy\u2026', { reaction: 'sleepy' }),
  line('petting', '*yawn*', { reaction: 'sleepy' }),
  line('petting', 'Oh! You startled me!', { reaction: 'surprised' }),
  line('petting', 'Huh? What\u2019s that?', { reaction: 'surprised', personality: 'curious' }),
  line('petting', 'Catch me if you can!', { reaction: 'playful' }),
  line('petting', 'Follow me!', { reaction: 'playful', personality: 'adventurous' }),
  line('petting', 'Eep! \u2026hi.', { reaction: 'shy' }),
  line('petting', 'Give me a second\u2026', { reaction: 'shy', maxFriendship: 39 }),
];
