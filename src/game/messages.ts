import type { EggAction } from '@/types';

export const ACTION_MESSAGES: Record<EggAction, readonly string[]> = {
  tap: [
    'The shell answers with a faint tick.',
    'Something shifts inside.',
    'Tap, tap. It seems to be listening.',
  ],
  observe: [
    'A shadow moves behind the shell.',
    'The speckles seem to drift when you look away.',
    'You could swear it just turned toward you.',
  ],
  incubate: [
    'The shell soaks up the warmth.',
    'A soft glow gathers under your hands.',
    'It settles in, humming very quietly.',
  ],
  wait: [
    'You sit together while the light changes.',
    'Time passes. The egg feels a little closer to ready.',
    'Nothing happens, and that is exactly right.',
  ],
};

export const MILESTONE_MESSAGES: Record<number, string> = {
  25: 'It is warm now. Something in there is awake.',
  50: 'A hairline crack has appeared.',
  75: 'The cracks are spreading. It will not be long.',
};

export const IDLE_MESSAGE = 'It is warm to the touch. Tap the egg, or sit with it a while.';
