import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { AppShellTab } from '../../../types/app';
import { Button } from '../../ui/button';
import TabContextMenu from './TabContextMenu';

type AppTabStripProps = {
  tabs: AppShellTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onActivateHome?: () => void;
  onAddTab: () => void;
};

export default function AppTabStrip({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
}: AppTabStripProps) {
  const [menuState, setMenuState] = useState<{ tabId: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuState(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="flex items-center gap-2 border-b border-border/60 bg-card/95 px-3 py-2 backdrop-blur sm:px-4">
      <div
        role="tablist"
        aria-label="Session tabs"
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-large border border-border/60 bg-surface-1/80 p-1 shadow-ring"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              role="presentation"
              onContextMenu={(event) => {
                event.preventDefault();
                setMenuState({ tabId: tab.id, x: event.clientX, y: event.clientY });
              }}
              className={`group flex shrink-0 items-center gap-1 rounded-pill border px-1 py-1 transition-colors ${
                isActive
                  ? 'border-border/70 bg-card text-foreground shadow-button'
                  : 'border-transparent bg-transparent text-muted-foreground hover:border-border/50 hover:bg-surface-2/70 hover:text-foreground'
              }`}
            >
              <Button
                role="tab"
                aria-selected={isActive}
                type="button"
                variant="ghost"
                onClick={() => onSelectTab(tab.id)}
                className={`h-9 rounded-pill border-0 px-3 text-sm font-medium tracking-ui shadow-none ${
                  isActive
                    ? 'text-foreground hover:opacity-100'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="max-w-44 truncate">{tab.label}</span>
              </Button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`rounded-pill p-1 transition-opacity hover:text-foreground hover:opacity-60 ${
                  isActive
                    ? 'text-muted-foreground opacity-100'
                    : 'text-muted-foreground opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
                }`}
                aria-label={`Close ${tab.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 flex-shrink-0 rounded-pill border border-border/60 bg-surface-1/80 shadow-ring"
        onClick={onAddTab}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <TabContextMenu
        open={Boolean(menuState)}
        x={menuState?.x || 0}
        y={menuState?.y || 0}
        onClose={() => setMenuState(null)}
        onCloseTab={() => {
          if (menuState) {
            onCloseTab(menuState.tabId);
          }
        }}
      />
    </div>
  );
}
