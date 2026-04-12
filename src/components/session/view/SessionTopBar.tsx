import { Archive, MoreVertical, Pause, Play, Snowflake, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import type { SessionStatus } from '../../../types/session';
import { useSessionLifecycle } from '../../../hooks/useSessionLifecycle';
import FrozenSessionOverlay from './FrozenSessionOverlay';

interface SessionTopBarProps {
  sessionId: string;
  /** Initial status from parent data; real-time status is tracked via WebSocket. */
  status: SessionStatus;
  title?: string | null;
  /** Called after a lifecycle action succeeds so the parent can refresh or navigate. */
  onStatusChange?: (sessionId: string, status: SessionStatus) => void;
  className?: string;
}

const STATUS_BADGE_CONFIG: Record<
  SessionStatus,
  { label: string; className: string; dotClass?: string }
> = {
  active: {
    label: 'Active',
    className: 'text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  frozen: {
    label: 'Frozen',
    className: 'text-sky-600 dark:text-sky-400',
  },
  archived: {
    label: 'Archived',
    className: 'text-muted-foreground',
  },
  deleted: {
    label: 'Deleted',
    className: 'text-destructive',
  },
};

/**
 * SessionTopBar renders a slim status bar above the chat interface with:
 * - A live status badge (active / frozen / archived)
 * - Freeze or Resume action button depending on current status
 * - Kebab overflow menu for Archive and Delete
 * - FrozenSessionOverlay rendered below when session is frozen (covers the composer area)
 */
export default function SessionTopBar({
  sessionId,
  status,
  title,
  onStatusChange,
  className,
}: SessionTopBarProps) {
  const lifecycle = useSessionLifecycle();
  const [kebabOpen, setKebabOpen] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);

  const effectiveStatus = lifecycle.getStatus(sessionId, status);
  const isLoading = lifecycle.loadingIds.has(sessionId);
  const badge = STATUS_BADGE_CONFIG[effectiveStatus] ?? STATUS_BADGE_CONFIG.active;

  // Close kebab on outside click
  useEffect(() => {
    if (!kebabOpen) return;
    const handler = (e: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setKebabOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [kebabOpen]);

  const handleFreeze = async () => {
    const success = await lifecycle.freezeSession(sessionId);
    if (success) onStatusChange?.(sessionId, 'frozen');
  };

  const handleResume = async () => {
    const success = await lifecycle.resumeSession(sessionId);
    if (success) onStatusChange?.(sessionId, 'active');
  };

  const handleArchive = async () => {
    setKebabOpen(false);
    const success = await lifecycle.archiveSession(sessionId);
    if (success) onStatusChange?.(sessionId, 'archived');
  };

  const handleDelete = async () => {
    setKebabOpen(false);
    const success = await lifecycle.deleteSession(sessionId);
    if (success) onStatusChange?.(sessionId, 'deleted');
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Top bar strip */}
      <div className="flex items-center gap-2 border-b border-border/70 bg-background/90 px-4 py-2">
        {/* Status badge */}
        <span className={cn('flex items-center gap-1.5 text-xs font-medium', badge.className)}>
          {effectiveStatus === 'active' && badge.dotClass ? (
            <span
              className={cn('inline-block h-2 w-2 flex-shrink-0 rounded-full', badge.dotClass)}
            />
          ) : effectiveStatus === 'frozen' ? (
            <Snowflake className="h-3 w-3 flex-shrink-0" />
          ) : effectiveStatus === 'archived' ? (
            <Archive className="h-3 w-3 flex-shrink-0" />
          ) : null}
          {badge.label}
        </span>

        {title && (
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{title}</span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {effectiveStatus === 'active' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={handleFreeze}
              disabled={isLoading}
            >
              <Pause className="h-3.5 w-3.5" />
              Freeze
            </Button>
          )}

          {effectiveStatus === 'frozen' && (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={handleResume}
              disabled={isLoading}
            >
              <Play className="h-3.5 w-3.5" />
              Resume
            </Button>
          )}

          {/* Kebab overflow menu */}
          <div ref={kebabRef} className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setKebabOpen((o) => !o)}
              aria-label="More actions"
              aria-expanded={kebabOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {kebabOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-large border border-border/70 bg-card p-1.5 shadow-ring">
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 rounded-medium px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline error feedback */}
      {lifecycle.error && (
        <div className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
          {lifecycle.error}
          <button
            type="button"
            className="ml-2 underline"
            onClick={lifecycle.clearError}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Frozen overlay — covers the composer area below the top bar */}
      {effectiveStatus === 'frozen' && (
        <FrozenSessionOverlay
          sessionId={sessionId}
          onResume={handleResume}
          isResuming={isLoading}
        />
      )}
    </div>
  );
}
