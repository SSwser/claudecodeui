import { FolderPlus, MessageSquarePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FavoritesSection, {
  type FavoriteSessionCard,
  type FavoriteWorkspaceCard,
} from './FavoritesSection';
import HomeFilters from './HomeFilters';
import RecentSessionsList, { type RecentSessionItem } from './RecentSessionsList';
import type { SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export type LandingPageViewModel = {
  filters: {
    search: string;
    project: string | null;
    workspace: string | null;
    sessionType: string;
  };
  favoriteWorkspaces: FavoriteWorkspaceCard[];
  favoriteSessions: FavoriteSessionCard[];
  recentSessions: RecentSessionItem[];
  projectOptions: SelectOption[];
  workspaceOptions: SelectOption[];
};

type LandingPageProps = {
  viewModel: LandingPageViewModel;
  onSearchChange: (value: string) => void;
  onProjectChange: (value: string | null) => void;
  onWorkspaceChange: (value: string | null) => void;
  onSessionTypeChange: (value: string) => void;
  onOpenWorkspace: (projectName: string) => void;
  onOpenSession: (sessionId: string) => void;
  onToggleWorkspaceFavorite: (projectName: string, displayName: string, path?: string) => void;
  onToggleSessionFavorite: (sessionId: string) => void;
  onCreateSession: () => void;
  onCreateWorkspace: () => void;
};

export default function LandingPage({
  viewModel,
  onSearchChange,
  onProjectChange,
  onWorkspaceChange,
  onSessionTypeChange,
  onOpenWorkspace,
  onOpenSession,
  onToggleWorkspaceFavorite,
  onToggleSessionFavorite,
  onCreateSession,
  onCreateWorkspace,
}: LandingPageProps) {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top_left,_rgba(255,99,99,0.08),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(85,179,255,0.08),_transparent_18%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-large border border-border/70 bg-card/95 p-6 shadow-ring sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-ui text-brand">Chorus</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-display text-foreground sm:text-4xl">
                {t('landing.title')}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 tracking-body text-muted-foreground sm:text-base">
                {t('landing.subtitle')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={onCreateSession}
                className="hover:bg-brand/92 h-11 rounded-pill border-brand/30 bg-brand text-brand-foreground shadow-subtle transition-colors hover:opacity-100"
              >
                <MessageSquarePlus className="h-4 w-4" />
                {t('landing.createSession')}
              </Button>
              <Button
                variant="outline"
                onClick={onCreateWorkspace}
                className="rounded-small h-11 border-border/70 bg-surface-2/95 px-5 shadow-subtle transition-colors hover:bg-surface-3 hover:opacity-100"
              >
                <FolderPlus className="h-4 w-4" />
                {t('landing.createWorkspace')}
              </Button>
            </div>
          </div>
        </section>

        <HomeFilters
          search={viewModel.filters.search}
          project={viewModel.filters.project}
          workspace={viewModel.filters.workspace}
          sessionType={viewModel.filters.sessionType}
          projectOptions={viewModel.projectOptions}
          workspaceOptions={viewModel.workspaceOptions}
          onSearchChange={onSearchChange}
          onProjectChange={onProjectChange}
          onWorkspaceChange={onWorkspaceChange}
          onSessionTypeChange={onSessionTypeChange}
        />

        <FavoritesSection
          workspaces={viewModel.favoriteWorkspaces}
          sessions={viewModel.favoriteSessions}
          onOpenWorkspace={onOpenWorkspace}
          onOpenSession={onOpenSession}
          onToggleWorkspaceFavorite={onToggleWorkspaceFavorite}
          onToggleSessionFavorite={onToggleSessionFavorite}
        />

        <RecentSessionsList
          sessions={viewModel.recentSessions}
          onOpenSession={onOpenSession}
          onToggleFavorite={onToggleSessionFavorite}
        />
      </div>
    </div>
  );
}
