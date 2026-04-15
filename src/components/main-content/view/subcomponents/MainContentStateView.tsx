import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LandingPage from '../../../home/view/LandingPage';
import AppLoadingScreen from '../../../../shared/view/ui/AppLoadingScreen';
import type { MainContentStateViewProps } from '../../types/types';
import MobileMenuButton from './MobileMenuButton';

export default function MainContentStateView({
  mode,
  isMobile,
  onMenuClick,
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

        <LandingPage
          viewModel={landingPageData}
          onSearchChange={onLandingFiltersChange.onSearchChange}
          onProjectChange={onLandingFiltersChange.onProjectChange}
          onWorkspaceChange={onLandingFiltersChange.onWorkspaceChange}
          onSessionTypeChange={onLandingFiltersChange.onSessionTypeChange}
          onOpenWorkspace={onLandingActions.onOpenWorkspace}
          onOpenSession={onLandingActions.onOpenSession}
          onToggleWorkspaceFavorite={onLandingActions.onToggleWorkspaceFavorite}
          onToggleSessionFavorite={onLandingActions.onToggleSessionFavorite}
          onCreateSession={onLandingActions.onCreateSession}
          onCreateWorkspace={onLandingActions.onCreateWorkspace}
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
        <div className="flex flex-1 items-center justify-center">
          <div className="mx-auto max-w-md px-6 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
              <Folder className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              {t('mainContent.chooseProject')}
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {t('mainContent.selectProjectDescription')}
            </p>
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-3.5">
              <p className="text-sm text-primary">
                <strong>{t('mainContent.tip')}:</strong>{' '}
                {isMobile
                  ? t('mainContent.createProjectMobile')
                  : t('mainContent.createProjectDesktop')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
