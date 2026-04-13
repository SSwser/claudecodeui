import { ArrowUpRight, FolderRoot, GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import type { SidebarRecentSession } from '../../types/types';

type GlobalRecentsSectionProps = {
  sessions: SidebarRecentSession[];
  onSessionSelect: (recentSession: SidebarRecentSession) => void;
  /** Navigate to full session history view. Wired to ArrowUpRight button. */
  onNavigateToHistory?: () => void;
};

/**
 * RECENT section — pinned at bottom of sidebar (design brief §7).
 * Max 5 rows, sorted by most recently active.
 */
export default function GlobalRecentsSection({
  sessions,
  onSessionSelect,
  onNavigateToHistory,
}: GlobalRecentsSectionProps) {
  const { t } = useTranslation('sidebar');

  // Count running sessions for the header chip
  const runningCount = sessions.filter(
    (s) => s.session.status === 'active' || s.session.isActive
  ).length;

  const visibleSessions = sessions.slice(0, 5);

  return (
    <section className="flex-shrink-0">
      {/* Divider — 1px #161718 */}
      <div className="h-px w-full bg-border-subtle" />

      {/* Header row — 28px */}
      <div className="flex h-7 items-center justify-between px-[14px]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.8px] text-label-dim">
            {t('recents')}
          </span>
          {runningCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-[6px] py-[2px]">
              <span className="inline-block h-1.5 w-1.5 rounded-[3px] bg-warning" />
              <span className="text-[10px] text-warning">{runningCount} running</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onNavigateToHistory}
          disabled={!onNavigateToHistory}
          className="text-dim-foreground transition-colors hover:text-foreground disabled:pointer-events-none"
          aria-label="View all sessions"
        >
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {/* Session rows — 44px each */}
      {visibleSessions.length === 0 ? (
        <div className="px-[14px] py-3 text-[11px] text-dim-foreground">{t('recentsEmpty')}</div>
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
                className="flex w-full items-start gap-[6px] py-[6px] pl-3 pr-[14px] text-left transition-colors hover:bg-canvas"
              >
                {/* Status dot — 6×6px */}
                <span
                  className={cn('mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-[3px]', dotColor)}
                />

                <div
                  className="min-w-0 flex-1"
                  style={{ gap: '3px', display: 'flex', flexDirection: 'column' }}
                >
                  {/* Session name — 11px w500 */}
                  <p className="truncate text-[11px] font-medium text-foreground">
                    {recentSession.title}
                  </p>

                  {/* Project chip + branch chip — pl-3, gap-1 */}
                  <div className="flex items-center gap-1 pl-3">
                    <span className="inline-flex max-w-[80px] items-center gap-[2px] truncate rounded bg-surface-3 px-[6px] py-[2px] text-[10px] text-muted-foreground">
                      <FolderRoot className="h-[10px] w-[10px] flex-shrink-0 text-label-dim" />
                      <span className="truncate">{recentSession.displayProjectName}</span>
                    </span>
                    {recentSession.workspaceName && (
                      <span className="inline-flex max-w-[80px] items-center gap-[2px] truncate rounded bg-surface-3 px-[6px] py-[2px] text-[11px] text-muted-foreground">
                        <GitBranch className="h-[10px] w-[10px] flex-shrink-0 text-label-dim" />
                        <span className="truncate">{recentSession.workspaceName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Gap / divider — 12px spacer (design brief §7.4) */}
      <div className="h-3" />
    </section>
  );
}
