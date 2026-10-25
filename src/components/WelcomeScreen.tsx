import { ChevronRight } from 'lucide-react';
import type { Egg } from '@/types';
import { getEggLook } from '@/egg/appearance';
import { EggSprite } from './EggSprite';
import { Button, Screen, Stage } from './ui';

export function WelcomeScreen({ egg, onContinue }: { egg: Egg; onContinue: () => void }) {
  return (
    <Screen className="justify-center gap-6 py-6 text-center">
      <Stage className="h-[290px]">
        <EggSprite look={getEggLook(egg)} progress={0} scale={5} className="mb-3" />
      </Stage>
      <div>
        <h1 className="anim-rise text-[28px] font-bold leading-tight text-text">Something has been waiting for you.</h1>
        <p className="anim-rise mx-auto mt-2 max-w-[290px] text-[15px] leading-relaxed text-text-muted" style={{ animationDelay: '0.15s' }}>
          It arrived quietly. It is warm, and it is yours to look after.
        </p>
      </div>
      <Button className="anim-rise self-center" style={{ animationDelay: '0.3s' }} onClick={onContinue}>
        Meet the egg
        <ChevronRight size={18} aria-hidden />
      </Button>
    </Screen>
  );
}
