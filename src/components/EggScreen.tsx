import { useEffect, useState } from 'react';
import { FastForward } from 'lucide-react';
import type { EggAction, GameState } from '@/types';
import { getEggLook } from '@/egg/appearance';
import { getEggStage } from '@/egg/stages';
import { EGG_POOLS } from '@/egg/pools';
import {
  GAME_CONFIG, IDLE_MESSAGE, applyPassiveProgress, getActionStatus, performEggAction, setHatchProgress,
  type EggActionOutcome,
} from '@/game';
import { formatDuration } from '@/utils/format';
import { ACTION_ICONS } from './icons';
import { EggSprite } from './EggSprite';
import { Header } from './Header';
import { ProgressBar, Screen, Stage } from './ui';
import { useNow } from './useNow';
import type { UpdateGame } from './useGame';

const BUTTON_ACTIONS: EggAction[] = ['observe', 'incubate', 'wait'];

export function EggScreen({ game, update, variant }: { game: GameState; update: UpdateGame; variant: 'popup' | 'sidepanel' }) {
  const { egg } = game;
  const now = useNow(250);
  const [message, setMessage] = useState(IDLE_MESSAGE);
  const [bump, setBump] = useState(0);
  const look = getEggLook(egg);

  // The egg warms slowly on its own, including time spent with the browser closed.
  useEffect(() => {
    void update((s) => applyPassiveProgress(s, Date.now()));
    const id = setInterval(() => void update((s) => applyPassiveProgress(s, Date.now())), 20_000);
    return () => clearInterval(id);
  }, [update]);

  const act = async (action: EggAction) => {
    let outcome = null as EggActionOutcome | null;
    await update((s) => {
      outcome = performEggAction(s, action, Date.now());
      return outcome.state;
    });
    if (outcome?.message) setMessage(outcome.message);
    if (action === 'tap' && outcome?.gained) setBump((n) => n + 1);
  };

  const tapReady = getActionStatus(game, 'tap', now).ready;

  return (
    <Screen>
      <Header variant={variant} />

      <Stage className="min-h-0 flex-1">
        <button
          onClick={() => void act('tap')}
          disabled={!tapReady}
          aria-label="Tap the egg"
          className="mb-3 rounded-md transition-transform active:scale-[0.98]"
        >
          <div key={bump} className={bump > 0 ? 'anim-wobble' : ''} style={{ '--px': `${variant === 'popup' ? 4 : 5}px` } as React.CSSProperties}>
            <EggSprite look={look} progress={egg.hatchProgress} scale={variant === 'popup' ? 4 : 5} />
          </div>
        </button>
      </Stage>

      <div className="pt-3 text-center">
        <p className="text-lg font-bold text-text">{getEggStage(egg.hatchProgress)}</p>
        <p className="text-xs text-text-muted">{EGG_POOLS[egg.speciesPool].hint}</p>
        <p aria-live="polite" className="mx-auto mt-2 min-h-[2.5rem] max-w-[320px] text-sm leading-snug text-text-muted">
          {message}
        </p>
      </div>

      <div className="pb-5">
        <div className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-text-muted">
          <span>Hatching</span>
          <span className="tabular-nums">{Math.floor(egg.hatchProgress)}%</span>
        </div>
        <ProgressBar value={egg.hatchProgress} max={egg.hatchRequired} ticks={GAME_CONFIG.milestones} label="Hatch progress" />

        <div className="mt-3 grid grid-cols-3 gap-2">
          {BUTTON_ACTIONS.map((action) => {
            const cfg = GAME_CONFIG.eggActions[action];
            const status = getActionStatus(game, action, now);
            const Icon = ACTION_ICONS[action];
            return (
              <button
                key={action}
                onClick={() => void act(action)}
                disabled={!status.ready}
                title={cfg.description}
                className="flex flex-col items-center gap-0.5 rounded-md border border-border bg-surface px-2 py-2.5 text-text shadow-card transition
                  hover:border-border-hover hover:bg-surface-hover active:translate-y-px disabled:cursor-not-allowed disabled:bg-background-alt disabled:shadow-none"
              >
                <Icon size={20} className={status.ready ? 'text-primary-dark' : 'text-text-disabled'} aria-hidden />
                <span className="text-[13px] font-semibold">{cfg.label}</span>
                <span className="h-4 text-[11px] tabular-nums text-text-muted">
                  {status.ready ? cfg.description : formatDuration(status.remainingMs)}
                </span>
              </button>
            );
          })}
        </div>

        {import.meta.env.DEV && (
          <button
            onClick={() => void update((s) => setHatchProgress(s, s.egg.hatchRequired, Date.now()))}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text"
          >
            <FastForward size={13} aria-hidden /> Dev: skip to hatch
          </button>
        )}
      </div>
    </Screen>
  );
}
