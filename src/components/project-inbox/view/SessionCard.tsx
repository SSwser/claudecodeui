import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Clock3, MoreHorizontal, Pause, Play, Snowflake, Trash2 } from 'lucide-react';
import { Badge, Button, Tooltip } from '../../../shared/view/ui';
import { cn } from '../../../lib/utils';
import SessionProviderLogo from '../../llm-logo-provider/SessionProviderLogo';
import { formatTimeAgo } from '../../../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import type { SessionCardProps } from '../types/types';
import { useSessionLifecycle } from '../../../hooks/useSessionLifecycle';

const STATUS_META = {
  active: {
    label: 'Active',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  frozen: {
    label: 'Frozen',
    badgeClass:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300',
  },
  archived: {
    label: 'Archived',
    badgeClass:
      'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300',
  },
  deleted: {
    label: 'Deleted',
    badgeClass:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
  },
} as const;

export default function SessionCard({
  session,
  onSelect,
  onFreeze,
  onResume,
  onArchive,
  onDelete,
  onRename,
  actionsEnabled,
}: SessionCardProps) {
  const { t } = useTranslation('common');
  const now = useMemo(() => new Date(), []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const longPressTriggeredRef = useRef(false);
  const longPressTimerRef = useRef<number | null>(null);
  const lifecycle = useSessionLifecycle();

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const previewText = session.summary || session.title || session.sessionId;
  // Effective status: prefer real-time WS override over prop-derived status
  const effectiveStatus = lifecycle.getStatus(session.sessionId, session.status);
  const statusMeta = STATUS_META[effectiveStatus] || STATUS_META.active;
  const isLoading = lifecycle.loadingIds.has(session.sessionId);

  const openPreview = () => setPreviewOpen(true);
  const closePreview = () => setPreviewOpen(false);

  return (
    <div className="relative">
      <Tooltip content={previewText} position="top">
        <div
          role="button"
          tabIndex={0}
          className="group relative rounded-large border border-border/70 bg-card/90 p-4 text-left shadow-subtle transition hover:border-border hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          onClick={() => {
            if (longPressTriggeredRef.current) {
              longPressTriggeredRef.current = false;
              return;
            }

            onSelect(session);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect(session);
            }
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            setMenuOpen(true);
          }}
          onMouseEnter={openPreview}
          onMouseLeave={() => {
            closePreview();
            setMenuOpen(false);
          }}
          onTouchStart={() => {
            longPressTriggeredRef.current = false;
            longPressTimerRef.current = window.setTimeout(() => {
              longPressTriggeredRef.current = true;
              setPreviewOpen(true);
            }, 450);
          }}
          onTouchEnd={() => {
            if (longPressTimerRef.current) {
              window.clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }}
          onTouchCancel={() => {
            if (longPressTimerRef.current) {
              window.clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
            closePreview();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-large border border-border/70 bg-background/80">
                  <SessionProviderLogo provider={session.provider} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {session.title || session.summary || t('mainContent.untitledSession')}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {formatTimeAgo(session.lastActivity, now, t)}
                    </span>
                    {session.workspaceName ? (
                      <span className="rounded-pill border border-border/70 bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {session.workspaceName}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={cn('px-2 py-0.5 text-[11px] font-medium', statusMeta.badgeClass)}>
                  {effectiveStatus === 'frozen' ? <Snowflake className="mr-1 h-3 w-3" /> : null}
                  {statusMeta.label}
                </Badge>
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {session.provider}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((value) => !value);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {previewOpen ? (
            <div className="pointer-events-none absolute left-4 right-4 top-full z-20 mt-2 rounded-large border border-border/70 bg-card/95 p-3 text-sm leading-6 text-muted-foreground shadow-ring">
              {previewText}
            </div>
          ) : null}
        </div>
      </Tooltip>

      {menuOpen ? (
        <div className="absolute right-3 top-14 z-30 w-52 rounded-large border border-border/70 bg-card p-1.5 shadow-ring">
          {/* Resume — shown for frozen or archived sessions */}
          {(effectiveStatus === 'frozen' || effectiveStatus === 'archived') && (
            <button
              type="button"
              disabled={isLoading}
              onClick={async () => {
                setMenuOpen(false);
                const success = await lifecycle.resumeSession(session.sessionId);
                if (success) onResume?.(session);
              }}
              className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Resume
            </button>
          )}

          {/* Freeze — shown for active sessions */}
          {effectiveStatus === 'active' && (
            <button
              type="button"
              disabled={isLoading || actionsEnabled?.freeze === false}
              onClick={async () => {
                setMenuOpen(false);
                const success = await lifecycle.freezeSession(session.sessionId);
                if (success) onFreeze?.(session);
              }}
              className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pause className="h-4 w-4" />
              Freeze
            </button>
          )}

          {/* Archive — all non-archived statuses */}
          {effectiveStatus !== 'archived' && (
            <button
              type="button"
              disabled={isLoading || actionsEnabled?.archive === false}
              onClick={async () => {
                setMenuOpen(false);
                const success = await lifecycle.archiveSession(session.sessionId);
                if (success) onArchive?.(session);
              }}
              className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          )}

          {/* Rename — active only */}
          {effectiveStatus === 'active' && (
            <button
              type="button"
              disabled={actionsEnabled?.rename === false}
              onClick={() => {
                setMenuOpen(false);
                onRename?.(session);
              }}
              className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MoreHorizontal className="h-4 w-4" />
              Rename
            </button>
          )}

          {/* Delete — always available */}
          <button
            type="button"
            disabled={isLoading || actionsEnabled?.delete === false}
            onClick={async () => {
              setMenuOpen(false);
              const success = await lifecycle.deleteSession(session.sessionId);
              if (success) onDelete?.(session);
            }}
            className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
