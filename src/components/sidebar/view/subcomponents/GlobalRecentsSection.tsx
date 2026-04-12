import { Clock3, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import type { SidebarRecentSession } from '../../types/types';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';

type GlobalRecentsSectionProps = {
  sessions: SidebarRecentSession[];
  onSessionSelect: (recentSession: SidebarRecentSession) => void;
};

export default function GlobalRecentsSection({
  sessions,
  onSessionSelect,
}: GlobalRecentsSectionProps) {
  const { t } = useTranslation('sidebar');

  return (
    <section className="space-y-3 px-3 py-3">
      <div className="flex items-center gap-2 px-1">
        <Clock3 className="h-4 w-4 text-sidebar-foreground/70" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/70">
          {t('recents')}
        </h2>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sidebar-border/70 bg-sidebar-accent/20 px-3 py-4 text-sm text-sidebar-foreground/65">
          {t('recentsEmpty')}
        </div>
      ) : (
        <div className="space-y-1.5">
          {sessions.map((recentSession) => (
            <button
              key={`${recentSession.project.name}:${recentSession.session.id}`}
              type="button"
              onClick={() => onSessionSelect(recentSession)}
              className="group flex w-full items-start gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar px-3 py-3 text-left text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            >
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-accent/70 text-sidebar-foreground">
                <SessionProviderLogo
                  provider={recentSession.session.__provider}
                  className="h-4 w-4"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {recentSession.title}
                  </p>
                  {recentSession.isFavorite ? (
                    <Star className="h-3.5 w-3.5 flex-shrink-0 fill-current text-amber-400" />
                  ) : null}
                </div>

                <p className="mt-1 truncate text-xs text-sidebar-foreground/65">
                  {recentSession.displayProjectName}
                  {recentSession.workspaceName ? ` · ${recentSession.workspaceName}` : ''}
                </p>

                {recentSession.summary ? (
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-sidebar-foreground/72">
                    {recentSession.summary}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-2 text-xs text-sidebar-foreground/55">
                <span className="rounded-full bg-sidebar-accent/70 px-2 py-0.5">
                  {recentSession.lastActivityLabel}
                </span>
                <span className={cn('transition-opacity group-hover:opacity-100', recentSession.isFavorite ? 'opacity-100' : 'opacity-0')}>
                  <Star className="h-3 w-3 fill-current text-amber-400" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}