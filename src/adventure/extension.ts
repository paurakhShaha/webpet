import type { GameState } from '@/types';
import { getLocation } from './locations';

// Thin, safe wrappers around the Chrome APIs adventures use. Every call is guarded so the game keeps
// working (and the dev preview keeps loading) wherever an API isn't available.

export const ADVENTURE_ALARM = 'webpet-adventure';

export function scheduleAdventureAlarm(when: number): void {
  try { chrome.alarms?.create(ADVENTURE_ALARM, { when: Math.max(when, Date.now() + 1000) }); } catch { /* not in an extension */ }
}

export function clearAdventureAlarm(): void {
  try { void chrome.alarms?.clear(ADVENTURE_ALARM); } catch { /* ignore */ }
}

/** A small "!" on the toolbar icon while rewards are waiting. */
export function updateBadge(state: GameState): void {
  try {
    const waiting = !!state.adventure.pending;
    void chrome.action?.setBadgeText({ text: waiting ? '!' : '' });
    if (waiting) {
      void chrome.action?.setBadgeBackgroundColor({ color: '#7FAF8B' });
      void chrome.action?.setBadgeTextColor?.({ color: '#FFFDF8' });
    }
  } catch { /* ignore */ }
}

/** One quiet notification per adventure. */
export function notifyAdventureHome(state: GameState): void {
  const pending = state.adventure.pending;
  if (!pending || !state.pet) return;
  try {
    chrome.notifications?.create(`webpet-${pending.id}`, {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: `${state.pet.name} is back!`,
      message: `Home from the ${getLocation(pending.locationId).name}. Open WebPet to see what they found.`,
      priority: 0,
    });
  } catch { /* ignore */ }
}
