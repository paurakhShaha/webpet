import { createNewGame, loadSettings, touchGame, updateGame } from '@/storage';
import { applyCare, type Interaction } from '@/game';
import { syncAdventure } from '@/adventure/actions';
import { ADVENTURE_ALARM, notifyAdventureHome, updateBadge } from '@/adventure/extension';
import { PET_MESSAGE, type PetMessageResponse } from '@/messaging';

/**
 * Adventures run on timestamps, not on this worker. We only wake up (via an alarm, or when the browser starts)
 * to settle a finished adventure, put a "!" on the toolbar icon and send ONE notification.
 */
async function reconcileAdventure(): Promise<void> {
  const now = Date.now();
  const state = await updateGame((s) => syncAdventure(s, now));
  const { active, pending, notifiedId } = state.adventure;

  if (active) chrome.alarms.create(ADVENTURE_ALARM, { when: Math.max(active.expectedCompletion, now + 1000) });
  else void chrome.alarms.clear(ADVENTURE_ALARM);
  updateBadge(state);

  if (pending && notifiedId !== pending.id) {
    // Marked as notified even if notifications are off, so turning them on later never replays old news.
    if ((await loadSettings()).notifications) notifyAdventureHome(state);
    await updateGame((s) =>
      s.adventure.pending && s.adventure.notifiedId !== s.adventure.pending.id
        ? { ...s, adventure: { ...s.adventure, notifiedId: s.adventure.pending.id } }
        : s,
    );
  }
}

// Install / update / dev reload: make sure a save exists (only ever one egg) and any pending save upgrade is written.
chrome.runtime.onInstalled.addListener(() => {
  void createNewGame().then(() => touchGame()).then(() => reconcileAdventure());
});
chrome.runtime.onStartup.addListener(() => void reconcileAdventure());
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ADVENTURE_ALARM) void reconcileAdventure();
});

// The roaming pet on web pages can be petted. Pages ask us to do it so all writes go through one place.
chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse: (r: PetMessageResponse) => void) => {
  if ((message as { type?: string } | null)?.type !== PET_MESSAGE) return false;
  let interaction: Interaction | null = null;
  updateGame((state) => {
    const out = applyCare(state, { type: 'pet' }, Date.now());
    interaction = out.interaction;
    return out.state;
  })
    .then(() => sendResponse({ interaction }))
    .catch(() => sendResponse({ interaction: null }));
  return true; // respond asynchronously
});
