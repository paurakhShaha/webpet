import { useState } from 'react';
import { Check, Dices } from 'lucide-react';
import type { Pet } from '@/types';
import { GAME_CONFIG } from '@/game';
import { validatePetName } from '@/game/naming';
import { suggestName } from '@/pet/names';
import { PetSprite } from './PetSprite';
import { Button, Screen, Stage } from './ui';

export function NamingScreen({ pet, onSubmit }: { pet: Pet; onSubmit: (name: string) => Promise<string | null> }) {
  const [value, setValue] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const valid = validatePetName(value).ok;

  return (
    <Screen className="justify-center gap-5 py-6 text-center">
      <Stage className="h-[230px]" decor={false}>
        <PetSprite appearance={pet.appearance} element={pet.element} rarity={pet.rarity} scale={5} />
      </Stage>
      <h1 className="text-[26px] font-bold text-text">What&rsquo;s their name?</h1>

      <form
        className="w-full"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(value).then(setError);
        }}
      >
        <div className="flex gap-2">
          <input
            autoFocus
            value={value}
            maxLength={GAME_CONFIG.naming.maxLength + 8}
            onChange={(e) => { setValue(e.target.value); setError(null); }}
            aria-label="Pet name"
            aria-invalid={!!error}
            aria-describedby="name-help"
            placeholder="Type a name"
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-4 py-2.5 text-center text-lg text-text placeholder:text-text-disabled
              hover:border-border-hover focus:border-border-selected focus:outline-2 focus:outline-primary-dark"
          />
          <button
            type="button"
            onClick={() => { setValue(suggestName(pet.id, attempt)); setAttempt((n) => n + 1); setError(null); }}
            aria-label="Suggest a name"
            title="Suggest a name"
            className="rounded-md border border-border bg-surface px-3.5 text-primary-dark transition hover:border-border-hover hover:bg-surface-hover"
          >
            <Dices size={20} aria-hidden />
          </button>
        </div>
        <p id="name-help" className={`mt-2 min-h-5 text-xs ${error ? 'border-l-2 border-danger pl-2 text-left font-semibold text-text' : 'text-text-muted'}`}>
          {error ?? `Letters, numbers and spaces, up to ${GAME_CONFIG.naming.maxLength} characters. You can change it later.`}
        </p>
        <Button type="submit" className="mt-3" disabled={!valid} icon={Check}>Confirm name</Button>
      </form>
    </Screen>
  );
}
