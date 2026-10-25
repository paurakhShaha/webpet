import type { AdventureOutcome, Difficulty, RiskLevel } from '@/types';
import type { Outlook } from './actions';

export const OUTCOME_TITLE: Record<AdventureOutcome, string> = {
  triumph: 'A triumph',
  success: 'Adventure complete',
  retreat: 'Turned back safely',
};

export const outcomeLine = (outcome: AdventureOutcome, name: string): string =>
  ({
    triumph: `${name} came home with a spring in their step.`,
    success: `${name} made it through, a little scuffed and very proud.`,
    retreat: `It got tough, so ${name} headed home early. Nothing was lost, and they still found a few things.`,
  })[outcome];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
export const RISK_LABEL: Record<RiskLevel, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export const OUTLOOK_COPY: Record<Outlook, { label: string; text: string }> = {
  comfortable: { label: 'Looks comfortable', text: 'Your pet should handle this trip well.' },
  uncertain: { label: 'Could go either way', text: 'A stronger or better-prepared pet would help.' },
  risky: { label: 'Risky', text: 'They may have to turn back early. A shorter trip is safer.' },
};

export const WELCOME_BACK = 'Welcome back.';
export const WHILE_AWAY = 'While you were away\u2026';
