import type { GameState, Pet, Settings } from '@/types';
import { loadGame, loadSettings, subscribeToGame, subscribeToSettings } from '@/storage';
import { isPetAway } from '@/adventure/defaults';
import { mountRoamer, type Roamer } from './roamer';

// Content script: shows the hatched pet roaming over web pages.
// It reads WebPet's saved data (and asks the background worker to record a pet) — it never reads or changes the page itself.
declare global {
  interface Window { __webpetRoamer?: true }
}

async function main() {
  if (window.top !== window || window.__webpetRoamer) return;
  window.__webpetRoamer = true;

  let game: GameState | null = await loadGame();
  let settings: Settings = await loadSettings();
  let roamer: Roamer | null = null;

  let comeBack: ReturnType<typeof setTimeout> | undefined;
  const apply = () => {
    clearTimeout(comeBack);
    const pet: Pet | null = game?.phase === 'pet' ? game.pet : null;
    // The pet isn't on the page while it's out on an adventure; it reappears when it's due home.
    if (game && isPetAway(game, Date.now())) {
      comeBack = setTimeout(apply, Math.min(game.adventure.active!.expectedCompletion - Date.now() + 500, 2 ** 31 - 1));
      roamer?.destroy();
      roamer = null;
      return;
    }
    if (pet && settings.roam) {
      if (roamer) { roamer.setPet(pet); roamer.setChatter(settings.chatter); if (game) roamer.setWorld(game.world); }
      else roamer = mountRoamer(pet, { chatter: settings.chatter, world: game?.world });
    } else if (roamer) {
      roamer.destroy();
      roamer = null;
    }
  };

  subscribeToGame((g) => { game = g; apply(); });
  subscribeToSettings((s) => { settings = s; apply(); });
  apply();
}

void main().catch(() => {});
