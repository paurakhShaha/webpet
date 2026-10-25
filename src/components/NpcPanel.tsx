import { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, ScrollText, Store } from 'lucide-react';
import type { GameState, WorldNow } from '@/types';
import { activeQuests } from '@/quests/engine';
import { meetNpc } from '@/world/apply';
import { npcSays, type NpcDefinition } from '@/world/npcs';
import type { ShopSection } from '@/shop/listings';
import { NPC_PORTRAITS } from '@/pixel/npcs';
import { PixelCanvas } from './PixelCanvas';
import { Button } from './ui';
import type { UpdateGame } from './useGame';
import type { NavId } from '@/game/navigation';

interface Props {
  game: GameState;
  update: UpdateGame;
  npc: NpcDefinition;
  world: WorldNow;
  onBack: () => void;
  onOpenShop: (section: ShopSection) => void;
  onNavigate: (id: NavId) => void;
}

/** Talking with someone in the world. They greet you, chat, drop hints, and point you to their wares or requests. */
export function NpcPanel({ game, update, npc, world, onBack, onOpenShop, onNavigate }: Props) {
  const [n, setN] = useState(0);
  const ctx = { world, level: game.pet?.level ?? 1, flags: game.progress.flags };
  const first = !game.progress.flags.includes(`met:${npc.id}`);

  // The first conversation counts as meeting them (remembered, journaled, and it opens their requests).
  useEffect(() => { void update((s) => meetNpc(s, npc.id, npc.name, Date.now())); }, [update, npc.id, npc.name]);

  const line = n === 0
    ? npcSays(npc, 'greet', ctx, `${Math.floor(Date.now() / 3_600_000)}`)
    : npcSays(npc, n % 2 ? 'hint' : 'idle', ctx, `${n}`) || npcSays(npc, 'idle', ctx, `${n}`);
  const requests = activeQuests(game).filter((q) => q.def.giver === npc.id && !q.claimed);

  return (
    <div className="anim-rise space-y-3">
      <Button variant="ghost" icon={ArrowLeft} onClick={onBack} className="px-3 py-1.5">Back</Button>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3.5 shadow-card">
        <PixelCanvas grid={NPC_PORTRAITS[npc.id]} scale={6} label={npc.name} />
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight text-text">{npc.name}</h1>
          <p className="text-xs font-semibold text-text-muted">{npc.role}</p>
          {first && <p className="mt-1 text-[11px] font-semibold text-primary-dark">New friend</p>}
        </div>
      </div>
      <p aria-live="polite" className="relative rounded-lg border border-border bg-surface px-3.5 py-3 text-sm leading-snug text-text shadow-card">&ldquo;{line}&rdquo;</p>
      <p className="text-xs text-text-muted">{npc.blurb}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" icon={MessageCircle} onClick={() => setN((x) => x + 1)} className="px-4 py-2 text-[13px]">Chat</Button>
        {npc.sells?.length ? <Button icon={Store} onClick={() => onOpenShop(npc.sells![0])} className="px-4 py-2 text-[13px]">Browse wares</Button> : null}
        {npc.quests?.length ? (
          <Button variant="secondary" icon={ScrollText} onClick={() => onNavigate('quests')} className="px-4 py-2 text-[13px]">
            {requests.length ? `${requests.length} ${requests.length === 1 ? 'request' : 'requests'}` : 'Requests'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
