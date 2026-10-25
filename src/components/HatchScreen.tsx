import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Egg, Pet } from '@/types';
import { getEggLook } from '@/egg/appearance';
import { getSpecies } from '@/pet/species';
import { EggSprite } from './EggSprite';
import { PetSprite } from './PetSprite';
import { Button, RarityBadge, Screen, Stage } from './ui';

type Step = 'shake' | 'crack' | 'burst' | 'reveal';
const ORDER: Step[] = ['shake', 'crack', 'burst', 'reveal'];
const TIMINGS: Record<Exclude<Step, 'reveal'>, number> = { shake: 1700, crack: 1500, burst: 1000 };

const CAPTIONS: Record<Step, string> = {
  shake: 'Something is moving.',
  crack: 'Light is coming through.',
  burst: '',
  reveal: 'You found something special.',
};

/** A small, fixed ring of square "pixels" — just enough sparkle for the burst. */
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + (i % 2) * 0.25;
  const dist = 64 + (i % 3) * 22;
  return { dx: Math.round(Math.cos(angle) * dist), dy: Math.round(Math.sin(angle) * dist) - 12, size: i % 3 === 0 ? 8 : 4, delay: (i % 4) * 50 };
});

export function HatchScreen({ egg, pet, onContinue }: { egg: Egg; pet: Pet; onContinue: () => void }) {
  const [step, setStep] = useState<Step>('shake');
  const look = getEggLook(egg);

  useEffect(() => {
    if (step === 'reveal') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setTimeout(() => setStep(ORDER[ORDER.indexOf(step) + 1]), reduced ? 250 : TIMINGS[step]);
    return () => clearTimeout(id);
  }, [step]);

  return (
    <Screen className="justify-center gap-5 py-6 text-center">
      <Stage className="h-[300px]" decor={step === 'reveal'}>
        <div className="relative flex h-[210px] items-center justify-center">
          {step !== 'reveal' && (
            <EggSprite
              look={look}
              progress={step === 'shake' ? 60 : 100}
              open={step === 'burst'}
              mode={step === 'burst' ? 'still' : 'shake'}
              scale={5}
            />
          )}

          {step === 'burst' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
              {PARTICLES.map((p, i) => (
                <span
                  key={i}
                  className="anim-particle absolute"
                  style={{
                    '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, width: p.size, height: p.size, animationDelay: `${p.delay}ms`,
                    background: i % 3 === 0 ? `var(--color-rarity-${pet.rarity})` : 'var(--color-accent-yellow)',
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}

          {step === 'reveal' && (
            <div className="anim-pet-in" style={{ '--px': '5px' } as React.CSSProperties}>
              <PetSprite appearance={pet.appearance} element={pet.element} rarity={pet.rarity} scale={6} />
            </div>
          )}
        </div>
      </Stage>

      <h1 aria-live="polite" className="min-h-[2.25rem] text-[26px] font-bold text-text">{CAPTIONS[step]}</h1>

      {step === 'reveal' && (
        <div className="anim-rise flex flex-col items-center gap-6" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 text-text-muted">
            <span>A {getSpecies(pet.species).name}</span>
            <RarityBadge rarity={pet.rarity} />
          </div>
          <Button onClick={onContinue}>
            Give them a name
            <ChevronRight size={18} aria-hidden />
          </Button>
        </div>
      )}
    </Screen>
  );
}
