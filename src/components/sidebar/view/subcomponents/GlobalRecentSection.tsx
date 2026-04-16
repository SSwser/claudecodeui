import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { SidebarRecentSession } from '@/components/sidebar/types/types';

type GlobalRecentSectionProps = {
  sessions: SidebarRecentSession[];
  onSessionSelect: (recentSession: SidebarRecentSession) => void;
  /** Navigate to full session history view. Wired to ArrowUpRight button. */
  onNavigateToHistory?: () => void;
};

/**
 * RECENT section — pinned at bottom of sidebar (design brief §7).
 * Max 5 rows, sorted by most recently active.
 */
export default function GlobalRecentSection({
  sessions,
  onSessionSelect,
  onNavigateToHistory,
}: GlobalRecentSectionProps) {
  const { t } = useTranslation('sidebar');

  const visibleSessions = sessions.slice(0, 5);

  return (
    <section className="flex-shrink-0">
      <div className="h-px w-full bg-border" />

      <div className="flex h-7 items-center justify-between px-[14px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.8px] text-label-dim">
          {t('recents')}
        </span>
        <button
          type="button"
          onClick={onNavigateToHistory}
          disabled={!onNavigateToHistory}
          className="text-label-dim transition-colors hover:text-foreground disabled:pointer-events-none"
          aria-label="View all sessions"
        >
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {visibleSessions.length === 0 ? (
        <div className="px-[14px] py-3 text-[11px] text-label-dim">{t('recentsEmpty')}</div>
      ) : (
        <div>
          {visibleSessions.map((recentSession) => {
            const isRunning =
              recentSession.session.status === 'active' || recentSession.session.isActive;
            const isWaiting = false; // TODO: wire up waiting state

            const dotColor = isWaiting
              ? 'bg-brand'
              : isRunning
                ? 'bg-warning'
                : 'bg-dim-foreground';

            return (
              <button
                key={`${recentSession.project.name}:${recentSession.session.id}`}
                type="button"
                onClick={() => onSessionSelect(recentSession)}
                className="flex min-h-[44px] w-full items-start gap-[6px] py-[6px] pl-3 pr-[14px] text-left transition-[background-color,box-shadow] hover:bg-surface-2 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
              >
                <span
                  className={cn('mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-[3px]', dotColor)}
                />

                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <p className="truncate text-[11px] font-medium text-foreground">
                    {recentSession.title}
                  </p>

                  <div className="flex items-center gap-1 pl-3">
                    <span className="inline-flex max-w-[92px] items-center truncate rounded-[3px] bg-surface-3 px-[6px] py-px text-[10px] leading-[1.3] text-muted-foreground">
                      <span className="truncate">{recentSession.displayProjectName}</span>
                    </span>
                    {recentSession.workspaceName && (
                      <span className="inline-flex max-w-[92px] items-center truncate rounded-[3px] bg-surface-3 px-[6px] py-px text-[10px] leading-[1.3] text-muted-foreground">
                        <span className="truncate">{recentSession.workspaceName}</span>
                      </span>
                    )}
                    <span className="text-[10px] leading-[1.3] text-label-dim">
                      {recentSession.lastActivityLabel}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="h-3" />
    </section>
  );
}
