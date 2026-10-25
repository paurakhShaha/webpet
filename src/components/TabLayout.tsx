import type { ReactNode } from 'react';
import type { NavId } from '@/game/navigation';
import { Header } from './Header';
import { NavBar } from './NavBar';
import { Screen } from './ui';

/** The frame shared by every section: header, scrolling content, and the bottom navigation. */
export function TabLayout({ variant, active, onNavigate, dots, children, onSettings }: {
  variant: 'popup' | 'sidepanel'; active: NavId; onNavigate: (id: NavId) => void; dots?: Partial<Record<NavId, boolean>>; children: ReactNode; onSettings?: () => void;
}) {
  return (
    <Screen>
      <Header variant={variant} onSettings={onSettings} />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">{children}</div>
      <NavBar active={active} onNavigate={onNavigate} dots={dots} />
    </Screen>
  );
}
