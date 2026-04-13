import { Settings, Plug, ArrowUp } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { ReleaseInfo } from '../../../../types/sharedTypes';

type SidebarFooterProps = {
  updateAvailable: boolean;
  releaseInfo: ReleaseInfo | null;
  latestVersion: string | null;
  onShowVersionModal: () => void;
  onShowSettings: () => void;
  t: TFunction;
};

/**
 * Bottom Stack — design brief §8.
 * Update chip (conditional) + Plugins (36px) + Settings (36px).
 */
export default function SidebarFooter({
  updateAvailable,
  latestVersion,
  onShowVersionModal,
  onShowSettings,
  t,
}: SidebarFooterProps) {
  return (
    <div className="flex-shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      {/* Update chip — conditional, green (design brief §8) */}
      {updateAvailable && (
        <button
          className="flex w-full items-center gap-2 bg-[#0a1209] px-4 py-2 text-left text-success transition-colors hover:brightness-110"
          onClick={onShowVersionModal}
        >
          <ArrowUp className="h-3.5 w-3.5" />
          <span className="text-xs">
            Update available {latestVersion ? `v${latestVersion}` : ''}
          </span>
        </button>
      )}

      {/* Plugins row — 36px */}
      <button className="flex h-9 w-full items-center gap-3 px-4 text-[#cecece] transition-colors hover:bg-muted">
        <Plug className="h-3.5 w-3.5" />
        <span className="text-xs">Plugins</span>
      </button>

      {/* Settings row — 36px */}
      <button
        className="flex h-9 w-full items-center gap-3 px-4 text-[#cecece] transition-colors hover:bg-muted"
        onClick={onShowSettings}
      >
        <Settings className="h-3.5 w-3.5" />
        <span className="text-xs">{t('actions.settings')}</span>
      </button>
    </div>
  );
}
