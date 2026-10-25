import { GAME_CONFIG } from './config';

export type NameResult = { ok: true; value: string } | { ok: false; error: string };

/** Letters, numbers, spaces; trimmed, single-spaced, length-limited. */
export function validatePetName(raw: string): NameResult {
  const { minLength, maxLength } = GAME_CONFIG.naming;
  const value = raw.replace(/\s+/g, ' ').trim();
  if (value.length < minLength) return { ok: false, error: 'Every companion needs a name.' };
  if (value.length > maxLength) return { ok: false, error: `Keep it to ${maxLength} characters or fewer.` };
  if (!/^[A-Za-z0-9 ]+$/.test(value)) return { ok: false, error: 'Use letters, numbers, and spaces only.' };
  return { ok: true, value };
}
