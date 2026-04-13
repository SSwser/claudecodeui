import { FolderPlus, GitFork } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlobalRecentsSection from '../../../home/view/GlobalRecentsSection';
import AppLoadingScreen from '../../../../shared/view/ui/AppLoadingScreen';
import type { MainContentStateViewProps } from '../../types/types';
import MobileMenuButton from './MobileMenuButton';

export default function MainContentStateView({
  mode,
  isMobile,
  onMenuClick,
  onCreateProject,
  landingPageData,
  onLandingFiltersChange,
  onLandingActions,
}: MainContentStateViewProps) {
  const { t } = useTranslation();

  const isLoading = mode === 'loading';

  if (mode === 'home' && landingPageData && onLandingFiltersChange && onLandingActions) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        {isMobile && (
          <div className="pwa-header-safe flex-shrink-0 border-b border-border/50 bg-background/80 p-2 backdrop-blur-sm sm:p-3">
            <MobileMenuButton onMenuClick={onMenuClick} compact />
          </div>
        )}
        <GlobalRecentsSection
          data={landingPageData}
          onOpenSession={onLandingActions.onOpenSession}
          onToggleSessionFavorite={onLandingActions.onToggleSessionFavorite}
          onCreateProject={onLandingActions.onCreateWorkspace}
          onCreateSession={onLandingActions.onCreateSession}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {isMobile && (
        <div className="pwa-header-safe flex-shrink-0 border-b border-border/50 bg-background/80 p-2 backdrop-blur-sm sm:p-3">
          <MobileMenuButton onMenuClick={onMenuClick} compact />
        </div>
      )}

      {isLoading ? (
        <AppLoadingScreen
          title={t('mainContent.loading')}
          description={t('mainContent.settingUpWorkspace')}
          fullScreen={false}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-7">
            {/* App icon — matches Pencil "App — Empty Launch" hero */}
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#6366f1]"
              style={{ boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' }}
            />

            <div className="flex flex-col items-center gap-2">
              <h1 className="text-[28px] font-bold text-foreground">ClaudeCodeUI</h1>
              <p className="text-[15px] text-muted-foreground">
                {t('emptyLaunch.subtitle', 'All your AI agents. One command surface.')}
              </p>
            </div>

            {/* CTA cards */}
            <div className="flex gap-4">
              <button
                onClick={onCreateProject}
                className="flex w-60 flex-col gap-2.5 rounded-[10px] border border-white/[0.06] bg-[#141618] p-5 text-left transition-colors hover:border-white/10 hover:bg-[#1a1c1e]"
                style={{
                  boxShadow: '0 0 0 1px #1b1c1e, 0 1px 0 0 rgba(255, 255, 255, 0.05)',
                }}
              >
                <FolderPlus className="h-6 w-6 text-[#6366f1]" />
                <span className="text-[15px] font-semibold text-foreground">
                  {t('emptyLaunch.newProject', 'New Project')}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {t('emptyLaunch.newProjectDesc', 'Create a new project from a local folder')}
                </span>
                <span className="text-xs text-[#8b8c8e]">
                  {t('emptyLaunch.browse', 'Browse →')}
                </span>
              </button>

              <button
                disabled
                className="flex w-60 cursor-not-allowed flex-col gap-2.5 rounded-[10px] border border-white/[0.06] bg-[#141618] p-5 text-left opacity-50"
                style={{
                  boxShadow: '0 0 0 1px #1b1c1e, 0 1px 0 0 rgba(255, 255, 255, 0.05)',
                }}
              >
                <GitFork className="h-6 w-6 text-[#6366f1]" />
                <span className="text-[15px] font-semibold text-foreground">
                  {t('emptyLaunch.cloneRepo', 'Clone Repository')}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {t('emptyLaunch.cloneRepoDesc', 'Clone a git repo and open it as a new project')}
                </span>
                <span className="text-xs text-[#8b8c8e]">{t('emptyLaunch.start', 'Start →')}</span>
              </button>
            </div>

            {/* Keyboard shortcut tips */}
            <div className="flex items-center gap-3 text-xs text-[#3a3b3d]">
              <span>⌘K {t('emptyLaunch.tipQuickOpen', 'Quick open')}</span>
              <div className="h-3.5 w-px bg-[#2a2b2d]" />
              <span>⌘N {t('emptyLaunch.tipNewSession', 'New session')}</span>
              <div className="h-3.5 w-px bg-[#2a2b2d]" />
              <span>⌘P {t('emptyLaunch.tipSwitchProject', 'Switch project')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
