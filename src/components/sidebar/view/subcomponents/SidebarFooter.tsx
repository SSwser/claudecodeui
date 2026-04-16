import { Settings, Plug } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { ReleaseInfo } from '@/types/sharedTypes';

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
      {updateAvailable && (
        <button
          type="button"
          className="flex h-[30px] w-full items-center justify-between bg-success/10 px-[14px] text-left text-[11px] text-success transition-colors hover:bg-success/15"
          onClick={onShowVersionModal}
        >
          <span>↑ Update available {latestVersion ? `v${latestVersion}` : ''}</span>
          <span>→</span>
        </button>
      )}

      <button
        type="button"
        className="flex h-9 w-full items-center gap-[5px] px-[14px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Plug className="h-3.5 w-3.5" />
        <span className="text-[12px]">Plugins</span>
      </button>

      <button
        type="button"
        className="flex h-9 w-full items-center gap-[5px] px-[14px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        onClick={onShowSettings}
      >
        <Settings className="h-3.5 w-3.5" />
        <span className="text-[12px]">{t('actions.settings')}</span>
      </button>
    </div>
  );
}
