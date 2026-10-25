import { createRng } from '@/utils/rng';

export const SHOPKEEPER = { name: 'Mossy', title: 'Shopkeeper' };

/** What the shopkeeper says. Data, not UI. */
const LINES = {
  greeting: [
    'Welcome in! Take your time.',
    'Ah, a friend! Have a look around.',
    'Fresh stock today. Well, since this morning.',
  ],
  bought: ['Lovely choice!', 'That one\u2019s a favourite.', 'Thank you kindly!', 'It\u2019ll serve you well.'],
  broke: ['A bit short on gold? Adventures pay well.', 'Come back when your purse is heavier.', 'Not quite enough. Try a quest or two!'],
  soldOut: ['All gone for now. I restock regularly.', 'Sold out! More will come in soon.'],
  sold: ['Fair price. Pleasure doing business.', 'I can always use these.', 'Thank you! That\u2019ll sell nicely.'],
  basket: ['A little something for the road.', 'Fresh from the garden. On the house.'],
  basketGone: ['You\u2019ve had today\u2019s basket. Come back tomorrow!'],
  error: ['Hm, I can\u2019t do that.'],
} as const;

export type ShopTalk = keyof typeof LINES;

export function shopkeeperSays(kind: ShopTalk, seed: number): string {
  return createRng(`mossy:${kind}:${seed}`).pick(LINES[kind]);
}
