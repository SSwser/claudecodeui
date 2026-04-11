import { useMemo, useState } from 'react';
import { Heart, FolderKanban, MessageSquare, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';

export type FavoriteWorkspaceCard = {
  id: string;
  projectName: string;
  displayName: string;
  path?: string;
  sessionCount: number;
};

export type FavoriteSessionCard = {
  id: string;
  sessionId: string;
  projectName: string;
  title: string;
  provider: string;
  status: string;
  summary?: string;
};

type FavoritesSectionProps = {
  workspaces: FavoriteWorkspaceCard[];
  sessions: FavoriteSessionCard[];
  onOpenWorkspace: (projectName: string) => void;
  onOpenSession: (sessionId: string) => void;
  onToggleWorkspaceFavorite: (projectName: string, displayName: string, path?: string) => void;
  onToggleSessionFavorite: (sessionId: string) => void;
};

function SectionCard({
  title,
  subtitle,
  icon,
  onClick,
  onFavoriteToggle,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  onFavoriteToggle: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="group relative rounded-large border border-border/70 bg-surface-2 p-4 text-left shadow-subtle transition-opacity hover:opacity-60"
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onFavoriteToggle();
        }}
        className="absolute right-4 top-4 rounded-pill p-2 text-muted-foreground transition-opacity hover:text-brand hover:opacity-60"
        aria-label="Toggle favorite"
      >
        <Star className="h-4 w-4 fill-current" />
      </button>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-medium border border-border/60 bg-background text-brand shadow-subtle">
        {icon}
      </div>
      <div className="pr-10">
        <h4 className="truncate text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function FavoritesSection({
  workspaces,
  sessions,
  onOpenWorkspace,
  onOpenSession,
  onToggleWorkspaceFavorite,
  onToggleSessionFavorite,
}: FavoritesSectionProps) {
  const { t } = useTranslation('common');
  const [dialogOpen, setDialogOpen] = useState(false);

  const visibleWorkspaces = useMemo(() => workspaces.slice(0, 3), [workspaces]);
  const visibleSessions = useMemo(() => sessions.slice(0, 5), [sessions]);

  return (
    <section className="rounded-large border border-border/70 bg-card/95 p-6 shadow-ring">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Heart className="h-4 w-4 text-primary" />
            {t('landing.favoritesTitle')}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('landing.favoritesSubtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          {t('landing.viewAll')}
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <FolderKanban className="h-3.5 w-3.5" />
            {t('landing.workspaceFavorites')}
          </div>
          {visibleWorkspaces.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {visibleWorkspaces.map((workspace) => (
                <SectionCard
                  key={workspace.id}
                  title={workspace.displayName}
                  subtitle={
                    workspace.path || t('landing.sessionsCount', { count: workspace.sessionCount })
                  }
                  icon={<FolderKanban className="h-4 w-4" />}
                  onClick={() => onOpenWorkspace(workspace.projectName)}
                  onFavoriteToggle={() =>
                    onToggleWorkspaceFavorite(
                      workspace.projectName,
                      workspace.displayName,
                      workspace.path
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <p className="rounded-medium border border-dashed border-border/70 px-4 py-5 text-sm tracking-body text-muted-foreground">
              {t('landing.emptyWorkspaceFavorites')}
            </p>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {t('landing.sessionFavorites')}
          </div>
          {visibleSessions.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleSessions.map((session) => (
                <SectionCard
                  key={session.id}
                  title={session.title}
                  subtitle={`${session.projectName} · ${session.provider}`}
                  icon={<MessageSquare className="h-4 w-4" />}
                  onClick={() => onOpenSession(session.sessionId)}
                  onFavoriteToggle={() => onToggleSessionFavorite(session.sessionId)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-medium border border-dashed border-border/70 px-4 py-5 text-sm tracking-body text-muted-foreground">
              {t('landing.emptySessionFavorites')}
            </p>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('landing.allFavoritesTitle')}</DialogTitle>
            <DialogDescription>{t('landing.allFavoritesSubtitle')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                {t('landing.workspaceFavorites')}
              </h4>
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                    onOpenWorkspace(workspace.projectName);
                  }}
                  className="w-full rounded-medium border border-border/70 bg-surface-2 px-4 py-3 text-left transition-opacity hover:opacity-60"
                >
                  <div className="text-sm font-medium text-foreground">{workspace.displayName}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {workspace.path || workspace.projectName}
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                {t('landing.sessionFavorites')}
              </h4>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                    onOpenSession(session.sessionId);
                  }}
                  className="w-full rounded-medium border border-border/70 bg-surface-2 px-4 py-3 text-left transition-opacity hover:opacity-60"
                >
                  <div className="text-sm font-medium text-foreground">{session.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {session.projectName} · {session.provider}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
