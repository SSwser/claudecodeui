import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authenticatedFetch } from '../../../utils/api';
import { ReleaseInfo } from '../../../types/sharedTypes';
import { copyTextToClipboard } from '../../../utils/clipboard';
import type { InstallMode } from '../../../hooks/useVersionCheck';

interface VersionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseInfo: ReleaseInfo | null;
  currentVersion: string;
  latestVersion: string | null;
  installMode: InstallMode;
}

export function VersionUpgradeModal({
  isOpen,
  onClose,
  releaseInfo,
  currentVersion,
  latestVersion,
  installMode,
}: VersionUpgradeModalProps) {
  const { t } = useTranslation('common');
  const upgradeCommand =
    installMode === 'npm'
      ? t('versionUpdate.npmUpgradeCommand')
      : 'git checkout main && git pull && npm install';
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateOutput, setUpdateOutput] = useState('');
  const [updateError, setUpdateError] = useState('');

  const handleUpdateNow = useCallback(async () => {
    setIsUpdating(true);
    setUpdateOutput('Starting update...\n');
    setUpdateError('');

    try {
      // Call the backend API to run the update command
      const response = await authenticatedFetch('/api/system/update', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setUpdateOutput((prev) => prev + data.output + '\n');
        setUpdateOutput((prev) => prev + '\n✅ Update completed successfully!\n');
        setUpdateOutput((prev) => prev + 'Please restart the server to apply changes.\n');
      } else {
        setUpdateError(data.error || 'Update failed');
        setUpdateOutput(
          (prev) => prev + '\n❌ Update failed: ' + (data.error || 'Unknown error') + '\n'
        );
      }
    } catch (error: any) {
      setUpdateError(error.message);
      setUpdateOutput((prev) => prev + '\n❌ Update failed: ' + error.message + '\n');
    } finally {
      setIsUpdating(false);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('versionUpdate.ariaLabels.closeModal')}
      />

      {/* Modal */}
      <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-[28px] border border-border/80 bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-sm">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t('versionUpdate.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {releaseInfo?.title || t('versionUpdate.newVersionReady')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Version Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-muted/40 p-3">
            <span className="text-sm font-medium text-foreground">
              {t('versionUpdate.currentVersion')}
            </span>
            <span className="font-code text-sm text-foreground">{currentVersion}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-brand/20 bg-brand/10 p-3">
            <span className="text-sm font-medium text-foreground">
              {t('versionUpdate.latestVersion')}
            </span>
            <span className="font-code text-sm text-brand">{latestVersion}</span>
          </div>
        </div>

        {/* Changelog */}
        {releaseInfo?.body && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{t('versionUpdate.whatsNew')}</h3>
              {releaseInfo?.htmlUrl && (
                <a
                  href={releaseInfo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-brand underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
                >
                  {t('versionUpdate.viewFullRelease')}
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-muted-foreground dark:prose-invert">
                {cleanChangelog(releaseInfo.body)}
              </div>
            </div>
          </div>
        )}

        {/* Update Output */}
        {(updateOutput || updateError) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              {t('versionUpdate.updateProgress')}
            </h3>
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
              <pre className="font-code whitespace-pre-wrap text-xs text-foreground">
                {updateOutput}
              </pre>
            </div>
            {updateError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {updateError}
              </div>
            )}
          </div>
        )}

        {/* Upgrade Instructions */}
        {!isUpdating && !updateOutput && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              {t('versionUpdate.manualUpgrade')}
            </h3>
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-3 shadow-sm">
              <code className="font-code text-sm text-foreground">{upgradeCommand}</code>
            </div>
            <p className="text-xs text-muted-foreground">{t('versionUpdate.manualUpgradeHint')}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border/80 bg-muted/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {updateOutput ? t('versionUpdate.buttons.close') : t('versionUpdate.buttons.later')}
          </button>
          {!updateOutput && (
            <>
              <button
                onClick={() => copyTextToClipboard(upgradeCommand)}
                className="flex-1 rounded-xl border border-border/80 bg-muted/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t('versionUpdate.buttons.copyCommand')}
              </button>
              <button
                onClick={handleUpdateNow}
                disabled={isUpdating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('versionUpdate.buttons.updating')}
                  </>
                ) : (
                  t('versionUpdate.buttons.updateNow')
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Clean up changelog by removing GitHub-specific metadata
const cleanChangelog = (body: string) => {
  if (!body) return '';

  return (
    body
      // Remove full commit hashes (40 character hex strings)
      .replace(/\b[0-9a-f]{40}\b/gi, '')
      // Remove short commit hashes (7-10 character hex strings at start of line or after dash/space)
      .replace(/(?:^|\s|-)([0-9a-f]{7,10})\b/gi, '')
      // Remove "Full Changelog" links
      .replace(/\*\*Full Changelog\*\*:.*$/gim, '')
      // Remove compare links (e.g., https://github.com/.../compare/v1.0.0...v1.0.1)
      .replace(/https?:\/\/github\.com\/[^\/]+\/[^\/]+\/compare\/[^\s)]+/gi, '')
      // Clean up multiple consecutive empty lines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim whitespace
      .trim()
  );
};
