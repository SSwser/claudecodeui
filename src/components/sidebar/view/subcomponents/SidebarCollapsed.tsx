import { Settings, Plug } from 'lucide-react';
import type { TFunction } from 'i18next';

type SidebarCollapsedProps = {
  onExpand: () => void;
  onShowSettings: () => void;
  updateAvailable: boolean;
  onShowVersionModal: () => void;
  t: TFunction;
};

/**
 * Collapsed sidebar rail — 48px wide (design brief §9).
 *
 * Layout (top→bottom):
 *   PanelLeftOpen expand toggle
 *   ─ spacer ─
 *   Update dot (conditional)
 *   Plugins icon
 *   Settings icon
 */
export default function SidebarCollapsed({
  onExpand,
  onShowSettings,
  updateAvailable,
  onShowVersionModal,
  t,
}: SidebarCollapsedProps) {
  return (
    <div className="flex h-full w-12 select-none flex-col items-center bg-background py-3">
      {/* Expand toggle */}
      <button
        onClick={onExpand}
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted"
        aria-label={t('common:versionUpdate.ariaLabels.showSidebar')}
        title={t('common:versionUpdate.ariaLabels.showSidebar')}
      >
        <img src="/logo.svg" alt="Chorus" className="h-6 w-6 rounded-md" />
      </button>

      {/* Spacer pushes bottom icons down */}
      <div className="flex-1" />

      {/* Update dot — small green circle when update available */}
      {updateAvailable && (
        <button
          onClick={onShowVersionModal}
          className="mb-1 flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted"
          aria-label={t('common:versionUpdate.ariaLabels.updateAvailable')}
          title={t('common:versionUpdate.ariaLabels.updateAvailable')}
        >
          <span className="h-2 w-2 rounded-full bg-success" />
        </button>
      )}

      {/* Plugins — intentionally routes to Settings for now.
           A dedicated Plugins panel is a future-phase concern; avoid adding a
           separate onShowPlugins prop until the panel itself exists. */}
      <button
        onClick={onShowSettings}
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted"
        aria-label="Plugins"
        title="Plugins"
      >
        <Plug className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Settings */}
      <button
        onClick={onShowSettings}
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted"
        aria-label={t('actions.settings')}
        title={t('actions.settings')}
      >
        <Settings className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
