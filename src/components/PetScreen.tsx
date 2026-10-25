import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Drumstick, Heart, Moon, Pencil, Smile, Star, X, Zap } from 'lucide-react';
import type { FoodId, GameState } from '@/types';
import {
  ANIMATION_MS, CARE_CONFIG, GAME_CONFIG, applyCare, dismissAwaySummary, friendshipLevel, getMood, nextFriendshipLevel,
  say, syncCare, xpToNext, type CareRequest, type Interaction,
} from '@/game';
import type { NavId } from '@/game/navigation';
import { isPetAway } from '@/adventure/defaults';
import { getLocation } from '@/adventure/locations';
import { formatCountdown } from '@/utils/format';
import { PERSONALITIES } from '@/pet/personalities';
import { getSpecies } from '@/pet/species';
import { getTrait } from '@/pet/traits';
import { RARITY_CONFIG } from '@/rarity';
import { currentWorld } from '@/world';
import { AwayCard } from './AwayCard';
import { CareBar } from './CareBar';
import { Header } from './Header';
import { locationIcon } from './icons';
import { NavBar } from './NavBar';
import { PetSprite, type Activity } from './PetSprite';
import { SettingsPanel } from './SettingsPanel';
import { SpeechBubble, type Speech } from './SpeechBubble';
import { StatBar } from './StatBar';
import { Chip, ElementChip, ProgressBar, RarityBadge, Screen, Stage } from './ui';
import type { UpdateGame } from './useGame';
import { useLivePet } from './useLivePet';
import { useNow } from './useNow';
import { WorldChips, WorldOverlay } from './WorldBits';

interface Props {
  game: GameState;
  update: UpdateGame;
  variant: 'popup' | 'sidepanel';
  onRename: (name: string) => Promise<string | null>;
  onNavigate: (id: NavId) => void;
  dots?: Partial<Record<NavId, boolean>>;
}

const SPEECH_MS = 5200;

export function PetScreen({ game, update, variant, onRename, onNavigate, dots }: Props) {
  const now = useNow(1000);
  const saved = game.pet!;
  const pet = useLivePet(saved, now)!;
  const mood = getMood(pet);
  const world = currentWorld(game, now);
  const away = isPetAway(game, now);
  const trip = game.adventure.active;
  const scale = variant === 'popup' ? 5 : 6;

  const [view, setView] = useState<'pet' | 'settings'>('pet');
  const [trayOpen, setTrayOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pet.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [speech, setSpeech] = useState<Speech | null>(null);
  const counter = useRef(0);
  const activityTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const speechTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stageRef = useRef<HTMLDivElement>(null);

  const speak = useCallback((next: Omit<Speech, 'key'>, ms = SPEECH_MS) => {
    setSpeech({ ...next, key: ++counter.current });
    clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeech(null), ms);
  }, []);

  // On open: catch the pet up with the time that passed (this is what makes it work while the browser is closed),
  // then say hello.
  useEffect(() => {
    let cancelled = false;
    void update((s) => syncCare(s, Date.now())).then((s) => {
      if (cancelled || !s.pet) return;
      speak({ text: say('greeting', s.pet, Date.now(), Math.random, { world: currentWorld(s, Date.now()) }) });
    });
    return () => { cancelled = true; clearTimeout(activityTimer.current); clearTimeout(speechTimer.current); };
  }, [update, speak]);

  const perform = async (request: CareRequest, pointerDx?: number) => {
    let interaction = null as Interaction | null;
    await update((s) => {
      const out = applyCare(s, request, Date.now());
      interaction = out.interaction;
      return out.state;
    });
    if (!interaction) return;
    const i: Interaction = interaction;
    setTrayOpen(false);
    speak({ text: i.dialogue, narration: i.narration, notice: i.notice });
    clearTimeout(activityTimer.current);
    const leaning = i.reaction === 'playful' && pointerDx !== undefined ? { dx: pointerDx } : {};
    setActivity({ animation: i.animation, key: ++counter.current, food: i.food, ...leaning });
    const ms = ANIMATION_MS[i.animation];
    if (ms) activityTimer.current = setTimeout(() => setActivity(null), ms);
  };

  const onPetClick = (e: React.MouseEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    const center = rect ? rect.left + rect.width / 2 : e.clientX;
    const limit = 6 * scale;
    void perform({ type: 'pet' }, Math.max(-limit, Math.min(limit, Math.round((e.clientX - center) / scale) * scale)));
  };

  const save = async () => {
    const err = await onRename(draft);
    setNameError(err);
    if (!err) setEditing(false);
  };
  const cancelEdit = () => { setEditing(false); setDraft(pet.name); setNameError(null); };

  const friendship = Math.floor(pet.friendship);
  const nextLevel = nextFriendshipLevel(pet.friendship);
  const moodHint = { hungry: 'hungry', tired: 'tired', sad: 'feeling low', happy: 'happy', content: 'content', sleeping: 'asleep' }[mood];

  return (
    <Screen>
      <Header variant={variant} onSettings={() => setView(view === 'settings' ? 'pet' : 'settings')} />

      {view === 'settings' ? (
        <SettingsPanel pet={pet} world={game.world} update={update} onBack={() => setView('pet')} />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
            {game.awaySummary && <AwayCard summary={game.awaySummary} name={pet.name} onDismiss={() => void update(dismissAwaySummary)} />}

            <Stage
              className="h-[206px] shrink-0"
              overlay={speech && <SpeechBubble speech={speech} />}
              backdrop={<WorldOverlay world={world} />}
              corner={<WorldChips world={world} />}
            >
              {away && trip ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  {(() => { const Icon = locationIcon(getLocation(trip.locationId).icon); return <span className="grid size-12 place-items-center rounded-md border border-border-selected bg-background text-primary-dark"><Icon size={24} aria-hidden /></span>; })()}
                  <p className="text-sm font-bold text-text">{pet.name} is out at the {getLocation(trip.locationId).name}</p>
                  <p className="text-xs text-text-muted">Back in {formatCountdown(trip.expectedCompletion - now)}</p>
                </div>
              ) : (
                <div ref={stageRef} className="mt-10">
                  <button onClick={onPetClick} aria-label={`Pet ${pet.name}`} className="rounded-md outline-offset-4">
                    <PetSprite appearance={pet.appearance} element={pet.element} rarity={pet.rarity} scale={scale - 1} sleeping={!!pet.sleep} mood={mood} activity={activity} cosmetic={pet.cosmetic} />
                  </button>
                </div>
              )}
            </Stage>

            <div className="text-center">
              {editing ? (
                <form className="flex items-center justify-center gap-1" onSubmit={(e) => { e.preventDefault(); void save(); }}>
                  <input
                    autoFocus value={draft} aria-label="New name"
                    onChange={(e) => { setDraft(e.target.value); setNameError(null); }}
                    className="w-44 rounded-md border border-border bg-surface px-3 py-1 text-center text-xl font-bold text-text focus:border-border-selected focus:outline-2 focus:outline-primary-dark"
                  />
                  <button type="submit" aria-label="Save name" className="rounded-md p-2 text-primary-dark hover:bg-surface-active"><Check size={18} aria-hidden /></button>
                  <button type="button" aria-label="Cancel" onClick={cancelEdit} className="rounded-md p-2 text-text-muted hover:bg-surface-active"><X size={18} aria-hidden /></button>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <h1 className="text-[28px] font-bold leading-tight text-text">{pet.name}</h1>
                  <button onClick={() => { setDraft(pet.name); setEditing(true); }} aria-label="Rename" title="Rename" className="rounded-md p-1.5 text-text-muted transition hover:bg-surface-active hover:text-text">
                    <Pencil size={15} aria-hidden />
                  </button>
                </div>
              )}
              {nameError && <p className="mx-auto mt-1 w-fit border-l-2 border-danger pl-2 text-xs font-semibold text-text">{nameError}</p>}

              <div className="mt-1 flex items-center justify-center gap-2 text-[15px] text-text-muted">
                <span>{getSpecies(pet.species).name}</span>
                <RarityBadge rarity={pet.rarity} />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {pet.sleep && (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-accent-purple/25 px-2 py-0.5 text-xs font-semibold text-text"><Moon size={13} aria-hidden />Asleep</span>
                )}
                <Chip>{PERSONALITIES[pet.personality].label}</Chip>
                <ElementChip element={pet.element} />
                {pet.traits.map((id) => <Chip key={id} title={getTrait(id)?.description}>{getTrait(id)?.label ?? id}</Chip>)}
              </div>
            </div>

            {/* Level + friendship + needs */}
            <div
              className="space-y-3 rounded-lg border bg-surface px-4 py-3 shadow-card"
              style={{ borderColor: RARITY_CONFIG[pet.rarity].aura >= 0.25 ? `var(--color-rarity-${pet.rarity})` : 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2.5">
                <Star size={16} className="shrink-0 text-experience" aria-hidden />
                <span className="text-[13px] font-semibold text-text">Level {pet.level}</span>
                <div className="flex-1"><ProgressBar value={pet.experience} max={xpToNext(pet.level)} label="Experience" color="var(--color-experience)" /></div>
              </div>
              <div>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-text"><Heart size={16} className="text-friendship" aria-hidden />{friendshipLevel(pet.friendship)}</span>
                  <span className="text-xs tabular-nums text-text-muted">
                    {friendship}/{GAME_CONFIG.limits.friendshipMax}{nextLevel ? ` \u00b7 ${nextLevel.label} at ${nextLevel.min}` : ''}
                  </span>
                </div>
                <ProgressBar value={pet.friendship} max={GAME_CONFIG.limits.friendshipMax} label="Friendship" color="var(--color-friendship)" />
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                <StatBar icon={Drumstick} label="Hunger" value={pet.hunger} token="--color-hunger" hint={pet.hunger < CARE_CONFIG.decay.lowThreshold ? 'very hungry' : pet.hunger >= 80 ? 'satisfied' : undefined} />
                <StatBar icon={Smile} label="Happiness" value={pet.happiness} token="--color-happiness" hint={moodHint} />
                <StatBar icon={Zap} label="Energy" value={pet.energy} token="--color-energy" hint={pet.sleep ? 'resting' : undefined} />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <CareBar
              pet={pet}
              now={now}
              trayOpen={trayOpen}
              onToggleTray={() => setTrayOpen((o) => !o)}
              onFeed={(food: FoodId) => void perform({ type: 'feed', food })}
              onPlay={() => void perform({ type: 'play' })}
              onGroom={() => void perform({ type: 'groom' })}
              onSleep={() => void perform({ type: 'sleep' })}
              onWake={() => void perform({ type: 'wake' })}
              away={away}
              counts={game.inventory.items}
              onShop={() => onNavigate('shop')}
            />
          </div>

          <NavBar active="pet" onNavigate={onNavigate} dots={{ adventure: away, ...dots }} />
        </>
      )}
    </Screen>
  );
}
