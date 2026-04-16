import { FolderPlus, MessageSquarePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RecentSessionsList from './RecentSessionsList';
import type { LandingPageData } from '@/components/main-content/types/types';
import { Button } from '@/components/ui/button';

type GlobalRecentSectionProps = {
  data: LandingPageData;
  onOpenSession: (sessionId: string) => void;
  onToggleSessionFavorite: (sessionId: string) => void;
  onCreateProject: () => void;
  onCreateSession: () => void;
};

export default function GlobalRecentSection({
  data,
  onOpenSession,
  onToggleSessionFavorite,
  onCreateProject,
  onCreateSession,
}: GlobalRecentSectionProps) {
  const { t } = useTranslation('common');
  const canCreateSession = data.projectCount > 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top_left,_rgba(255,99,99,0.08),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(85,179,255,0.08),_transparent_18%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
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
                disabled={!canCreateSession}
                title={canCreateSession ? undefined : 'Create a project first'}
                className="hover:bg-brand/92 h-11 rounded-pill border-brand/30 bg-brand text-brand-foreground shadow-subtle transition-colors hover:opacity-100"
              >
                <MessageSquarePlus className="h-4 w-4" />
                {t('landing.createSession')}
              </Button>
              <Button
                variant="outline"
                onClick={onCreateProject}
                className="rounded-small h-11 border-border/70 bg-surface-2/95 px-5 shadow-subtle transition-colors hover:bg-surface-3 hover:opacity-100"
              >
                <FolderPlus className="h-4 w-4" />
                {t('workspaceWizard.buttons.createProject')}
              </Button>
            </div>
          </div>
        </section>

        <RecentSessionsList
          sessions={data.recentSessions}
          onOpenSession={onOpenSession}
          onToggleFavorite={onToggleSessionFavorite}
        />
      </div>
    </div>
  );
}
