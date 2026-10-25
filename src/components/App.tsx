import { useEffect, useState } from 'react';
import { collectAdventure, syncAdventure, type LevelUpInfo } from '@/adventure';
import { basketReady } from '@/shop/shop';
import type { ShopSection } from '@/shop/listings';
import { claimableCount } from '@/quests/engine';
import { syncProgression } from '@/progression/track';
import { clearAdventureAlarm, updateBadge } from '@/adventure/extension';
import { completeHatch, finishIntro, namePet, renamePet, startJourney, type NameOutcome } from '@/game';

import type { GameState } from '@/types';
import type { NavId } from '@/game/navigation';
import { AchievementToast } from './AchievementToast';
import { AdventureScreen } from './AdventureScreen';
import { EquipmentScreen } from './EquipmentScreen';
import { InventoryScreen } from './InventoryScreen';
import { JournalScreen } from './JournalScreen';
import { QuestsScreen } from './QuestsScreen';
import { ShopScreen } from './ShopScreen';
import { EggScreen } from './EggScreen';
import { HatchScreen } from './HatchScreen';
import { IntroScreen } from './IntroScreen';
import { LevelUpScreen } from './LevelUpScreen';
import { NamingScreen } from './NamingScreen';
import { PetScreen } from './PetScreen';
import { ReturnScreen } from './ReturnScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { Screen } from './ui';
import { useGame, type UpdateGame } from './useGame';
import { ThemeContext, useThemeState } from './useTheme';

type Variant = 'popup' | 'sidepanel';

/** Runs a name reducer and returns an error message, or null on success. */
async function submitName(update: UpdateGame, reducer: (s: GameState, name: string) => NameOutcome, name: string): Promise<string | null> {
  let error: string | null = null;
  await update((s) => {
    const result = reducer(s, name);
    if (!result.ok) {
      error = result.error;
      return s;
    }
    return result.state;
  });
  return error;
}

/**
 * Adventures finish on their own clock. Settle when the popup opens (the pet may have come home while the
 * browser was closed), and again at the moment it's due if the popup is still open.
 */
function useAdventureSettle(game: GameState | null, update: UpdateGame) {
  const ready = game?.phase === 'pet';
  const due = game?.adventure.active?.expectedCompletion;

  useEffect(() => {
    if (ready) void update((s) => syncAdventure(s, Date.now()));
  }, [ready, update]);

  useEffect(() => {
    if (!due) return;
    const ms = Math.min(Math.max(0, due - Date.now()) + 300, 2 ** 31 - 1);
    const id = setTimeout(() => void update((s) => syncAdventure(s, Date.now())), ms);
    return () => clearTimeout(id);
  }, [due, update]);
}

function PetPhase({ game, update, variant }: { game: GameState; update: UpdateGame; variant: Variant }) {
  const [tab, setTab] = useState<NavId>('pet');
  const [celebration, setCelebration] = useState<LevelUpInfo | null>(null);
  const [shopSection, setShopSection] = useState<ShopSection | undefined>(undefined);
  const pet = game.pet!;
  const pending = game.adventure.pending;

  // On open: roll over daily/weekly quests and catch achievements up with anything earned while away.
  useEffect(() => { void update((s) => syncProgression(s, Date.now())); }, [update]);

  const collect = async () => {
    let info: LevelUpInfo | null = null;
    await update((s) => {
      const out = collectAdventure(s, Date.now());
      info = out.report?.levelUp ?? null;
      return out.state;
    });
    clearAdventureAlarm();
    setTab('adventure');
    if (info) setCelebration(info);
  };

  if (celebration) return <LevelUpScreen pet={pet} info={celebration} onContinue={() => setCelebration(null)} />;
  if (pending) return <ReturnScreen key={pending.id} pet={pet} result={pending} onCollect={collect} />;

  // Small badges on the navigation: only for things worth a glance.
  const dots = {
    quests: claimableCount(game) > 0,
    journal: game.progress.unseenAchievements.length > 0,
    shop: basketReady(game, Date.now()),
  };
  const openShop = (section: ShopSection) => { setShopSection(section); setTab('shop'); };
  const common = { game, update, variant, onNavigate: (id: NavId) => { if (id === 'shop') setShopSection(undefined); setTab(id); }, dots };

  switch (tab) {
    case 'adventure': return <AdventureScreen {...common} onLevelUp={setCelebration} onOpenShop={openShop} />;
    case 'inventory': return <InventoryScreen {...common} />;
    case 'equipment': return <EquipmentScreen {...common} />;
    case 'quests': return <QuestsScreen {...common} onLevelUp={setCelebration} />;
    case 'shop': return <ShopScreen {...common} initialSection={shopSection} />;
    case 'journal': return <JournalScreen {...common} />;
    default: return <PetScreen {...common} onRename={(name) => submitName(update, renamePet, name)} />;
  }
}

function renderPhase(game: GameState, update: UpdateGame, variant: Variant) {
  const { pet } = game;
  switch (game.phase) {
    case 'welcome':
      return <WelcomeScreen egg={game.egg} onContinue={() => void update((s) => startJourney(s, Date.now()))} />;
    case 'egg':
      return <EggScreen game={game} update={update} variant={variant} />;
    case 'hatching':
      return pet && <HatchScreen egg={game.egg} pet={pet} onContinue={() => void update(completeHatch)} />;
    case 'naming':
      return pet && <NamingScreen pet={pet} onSubmit={(name) => submitName(update, namePet, name)} />;
    case 'intro':
      return pet && <IntroScreen pet={pet} onContinue={() => void update(finishIntro)} />;
    case 'pet':
      return pet && <PetPhase game={game} update={update} variant={variant} />;
  }
}

export function App({ variant }: { variant: Variant }) {
  const { state, update } = useGame();
  const theme = useThemeState();
  useAdventureSettle(state, update);

  // Keep the toolbar badge in step with what's waiting.
  const waiting = state?.adventure.pending?.id;
  useEffect(() => { if (state) updateBadge(state); }, [waiting]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeContext.Provider value={theme}>
      <div className="relative h-full">
        {state ? renderPhase(state, update, variant) : <Screen />}
        {state?.phase === 'pet' && <AchievementToast game={state} />}
      </div>
    </ThemeContext.Provider>
  );
}
