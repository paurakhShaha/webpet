import { ChevronRight } from 'lucide-react';
import type { Pet } from '@/types';
import { PERSONALITIES } from '@/pet/personalities';
import { getSpecies } from '@/pet/species';
import { PetSprite } from './PetSprite';
import { Button, ElementChip, RarityBadge, Screen, Stage } from './ui';

export function IntroScreen({ pet, onContinue }: { pet: Pet; onContinue: () => void }) {
  const personality = PERSONALITIES[pet.personality];
  return (
    <Screen className="justify-center gap-5 py-6 text-center">
      <Stage className="h-[250px]">
        <PetSprite appearance={pet.appearance} element={pet.element} rarity={pet.rarity} scale={5} />
      </Stage>
      <div>
        <h1 className="anim-rise text-[30px] font-bold leading-tight text-text">Meet {pet.name}.</h1>
        <p className="anim-rise mx-auto mt-2 max-w-[290px] text-[15px] leading-relaxed text-text-muted" style={{ animationDelay: '0.15s' }}>
          A {personality.label.toLowerCase()} {getSpecies(pet.species).name.toLowerCase()}. {personality.description}
        </p>
        <div className="anim-rise mt-3 flex items-center justify-center gap-2" style={{ animationDelay: '0.3s' }}>
          <RarityBadge rarity={pet.rarity} />
          <ElementChip element={pet.element} />
        </div>
      </div>
      <Button className="anim-rise self-center" style={{ animationDelay: '0.45s' }} onClick={onContinue}>
        Start together
        <ChevronRight size={18} aria-hidden />
      </Button>
    </Screen>
  );
}
