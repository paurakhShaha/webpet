import { Moon, PanelRight, Settings, Sun } from 'lucide-react';
import { DECOR } from '@/pixel/decor';
import { PixelCanvas } from './PixelCanvas';
import { useThemeApi } from './useTheme';

async function openSidePanel() {
  const win = await chrome.windows.getCurrent();
  if (win.id !== undefined) await chrome.sidePanel.open({ windowId: win.id });
  window.close();
}

const iconButton = 'rounded-md p-2 text-text-muted transition hover:bg-surface-active hover:text-text';

export function Header({ variant, onSettings }: { variant: 'popup' | 'sidepanel'; onSettings?: () => void }) {
  const { effective, toggle } = useThemeApi();
  const canOpenPanel = variant === 'popup' && typeof chrome !== 'undefined' && !!chrome.sidePanel?.open;
  const ThemeIcon = effective === 'dark' ? Sun : Moon;
  return (
    <header className="flex items-center justify-between pb-3 pt-4">
      <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-text">
        <PixelCanvas grid={DECOR.egg} scale={2} />
        WebPet
      </span>
      <div className="flex items-center gap-1">
        <button onClick={toggle} className={iconButton} aria-label={effective === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title="Toggle theme">
          <ThemeIcon size={18} aria-hidden />
        </button>
        {onSettings && (
          <button onClick={onSettings} className={iconButton} aria-label="Settings" title="Settings">
            <Settings size={18} aria-hidden />
          </button>
        )}
        {canOpenPanel && (
          <button onClick={() => void openSidePanel()} className={iconButton} aria-label="Open in side panel" title="Open in side panel">
            <PanelRight size={18} aria-hidden />
          </button>
        )}
      </div>
    </header>
  );
}
