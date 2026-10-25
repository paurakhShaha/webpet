import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, Zap } from 'lucide-react';
import type { Pet } from '@/types';
import type { LevelUpInfo } from '@/adventure';
import { COMBAT_STAT_KEYS, COMBAT_STAT_LABELS } from '@/adventure/stats';
import { PetSprite } from './PetSprite';
import { Button, Screen } from './ui';

export function LevelUpScreen({ pet, info, onContinue }: { pet: Pet; info: LevelUpInfo; onContinue: () => void }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= COMBAT_STAT_KEYS.length + 1) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setTimeout(() => setShown((n) => n + 1), reduced ? 40 : 320);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <Screen className="items-center justify-center gap-4 py-4 text-center">
      <PetSprite appearance={pet.appearance} element={pet.element} rarity={pet.rarity} scale={5} activity={{ animation: 'levelup', key: 1 }} />
      <div>
        <h1 className="anim-rise text-[28px] font-bold text-text">Level up!</h1>
        <p className="anim-rise mt-0.5 inline-flex items-center gap-2 text-[15px] font-semibold text-text" style={{ animationDelay: '0.15s' }}>
          {pet.name} <span className="text-text-muted">Lv {info.from}</span><ArrowRight size={15} className="text-primary-dark" aria-hidden /><span className="text-primary-dark">Lv {info.to}</span>
        </p>
      </div>

      <div className="w-full space-y-1.5 rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
        {COMBAT_STAT_KEYS.map((k, i) => (
          <div key={k} className={`flex items-center justify-between text-sm transition-opacity ${i < shown ? 'opacity-100' : 'opacity-0'}`}>
            <span className="font-semibold text-text-muted">{COMBAT_STAT_LABELS[k]}</span>
            <span className="tabular-nums text-text">
              {info.before[k]} <span className="text-text-muted">&rarr;</span> <span className="font-bold">{info.after[k]}</span>
              <span className="ml-2 text-xs font-bold text-primary-dark">+{info.after[k] - info.before[k]}</span>
            </span>
          </div>
        ))}
      </div>

      {info.energyRestored > 0 && (
        <p className={`inline-flex items-center gap-1.5 text-sm font-semibold text-text transition-opacity ${shown > COMBAT_STAT_KEYS.length ? 'opacity-100' : 'opacity-0'}`}>
          <Zap size={15} className="text-energy" aria-hidden />Energy restored +{info.energyRestored}
        </p>
      )}
      {info.unlocks.length > 0 && (
        <div className="anim-rise w-full rounded-lg border border-border-selected bg-surface px-4 py-3 text-left shadow-card">
          <p className="mb-1 text-[13px] font-bold text-text">New things to try</p>
          <ul className="space-y-0.5 text-xs text-text-muted">
            {info.unlocks.slice(0, 5).map((u) => <li key={u.label}><span className="font-semibold text-text">{u.label}</span> <span>— {u.kind === 'area' ? 'new area' : u.kind === 'quest' ? 'new quest' : u.kind === 'cosmetic' ? 'new style in the shop' : 'now in the shop'}</span></li>)}
          </ul>
        </div>
      )}
      <Button onClick={onContinue} className="mt-1">Continue<ChevronRight size={18} aria-hidden /></Button>
    </Screen>
  );
}
