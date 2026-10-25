import { ArrowLeft, Bell, CalendarDays, Footprints, MessageCircle, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Pet, WorldState } from '@/types';
import { SEASON_LABEL } from '@/world/clock';
import { Button, Switch } from './ui';
import type { UpdateGame } from './useGame';
import { useSettings } from './useSettings';

function Row({ icon: Icon, title, text, children }: { icon: LucideIcon; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
      <Icon size={18} className="shrink-0 text-primary-dark" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{title}</p>
        <p className="text-xs text-text-muted">{text}</p>
      </div>
      {children}
    </div>
  );
}

const SEASONS: WorldState['seasonMode'][] = ['auto', 'spring', 'summer', 'autumn', 'winter'];

export function SettingsPanel({ pet, world, update: updateGame, onBack }: { pet: Pet; world: WorldState; update: UpdateGame; onBack: () => void }) {
  const { settings, update } = useSettings();
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack} className="px-3 py-1.5">Back</Button>
        <h1 className="text-lg font-bold text-text">Settings</h1>
      </div>
      <Row icon={Footprints} title={`Let ${pet.name} roam`} text="Wanders around the pages you browse. Reload open tabs to see it.">
        <Switch checked={settings.roam} onChange={(roam) => void update({ roam })} label="Let your pet roam web pages" />
      </Row>
      <Row icon={MessageCircle} title="Speech bubbles" text="Now and then, while roaming, your pet says something.">
        <Switch checked={settings.chatter} onChange={(chatter) => void update({ chatter })} label="Speech bubbles while roaming" />
      </Row>
      <Row icon={Bell} title="Adventure notifications" text="One quiet notification when your pet is back from an adventure.">
        <Switch checked={settings.notifications} onChange={(notifications) => void update({ notifications })} label="Notify me when an adventure finishes" />
      </Row>
      <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
        <p className="flex items-center gap-2 text-sm font-semibold text-text"><CalendarDays size={18} className="shrink-0 text-primary-dark" aria-hidden />World season</p>
        <p className="mt-0.5 text-xs text-text-muted">Auto follows your calendar. Pick one if the seasons are different where you live.</p>
        <div role="radiogroup" aria-label="World season" className="mt-2 flex flex-wrap gap-1.5">
          {SEASONS.map((m) => (
            <button key={m} role="radio" aria-checked={world.seasonMode === m} onClick={() => void updateGame((s) => ({ ...s, world: { ...s.world, seasonMode: m } }))}
              className={`rounded-sm border px-2.5 py-1 text-xs font-semibold transition ${world.seasonMode === m ? 'border-border-selected bg-primary/15 text-text' : 'border-border bg-surface text-text-muted hover:border-border-hover hover:text-text'}`}>
              {m === 'auto' ? 'Auto' : SEASON_LABEL[m]}
            </button>
          ))}
        </div>
      </div>
      <Row icon={ShieldCheck} title="Your privacy" text="WebPet never reads your browsing history, tabs or pages. The world runs on your own clock, and everything is saved only on this device." />
    </div>
  );
}
