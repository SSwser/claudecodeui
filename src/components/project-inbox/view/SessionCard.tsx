import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, MoreHorizontal, Pause, Play, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import SessionProviderLogo from '../../llm-logo-provider/SessionProviderLogo';
import { formatTimeAgo } from '../../../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import type { SessionCardProps } from '../types/types';
import { useSessionLifecycle } from '../../../hooks/useSessionLifecycle';

/** Design: accent-bar class + status dot class + text classes per lifecycle state */
const STATUS_META = {
  active: {
    label: 'Active',
    accentBarClass: 'bg-warning',
    dotClass: 'bg-warning',
    subTextClass: 'text-muted-foreground',
    subLabel: 'Running',
    titleClass: 'text-foreground',
    timeClass: 'text-label-dim',
  },
  frozen: {
    label: 'Frozen',
    accentBarClass: null,
    dotClass: 'bg-frozen',
    subTextClass: 'text-frozen',
    subLabel: 'Frozen',
    titleClass: 'text-muted-foreground',
    timeClass: 'text-label-dim',
  },
  archived: {
    label: 'Archived',
    accentBarClass: null,
    dotClass: 'bg-label-dim',
    subTextClass: 'text-muted-foreground',
    subLabel: 'Archived',
    titleClass: 'text-muted-foreground',
    timeClass: 'text-label-dim',
  },
  deleted: {
    label: 'Deleted',
    accentBarClass: null,
    dotClass: 'bg-label-dim',
    subTextClass: 'text-muted-foreground',
    subLabel: 'Deleted',
    titleClass: 'text-muted-foreground',
    timeClass: 'text-label-dim',
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

  // Effective status: prefer real-time WS override over prop-derived status
  const effectiveStatus = lifecycle.getStatus(session.sessionId, session.status);
  const statusMeta = STATUS_META[effectiveStatus] || STATUS_META.active;
  const isLoading = lifecycle.loadingIds.has(session.sessionId);

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'group relative flex overflow-hidden rounded-[8px] text-left transition-colors',
          /* Card fill. Shadow/ring arbitrary values intentionally preserved —
             elevation semantic tokens are planned for Phase 999.2. */
          'bg-surface-2 shadow-[0_0_0_1px_#1b1c1e,0_0_0_1px_#07080a,0_1px_0_0_rgba(255,255,255,0.05)]',
          /* Inside stroke */
          'ring-1 ring-inset ring-[#ffffff0d]',
          'hover:bg-surface-2/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
        )}
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
        onMouseLeave={() => setMenuOpen(false)}
        onTouchStart={() => {
          longPressTriggeredRef.current = false;
          longPressTimerRef.current = window.setTimeout(() => {
            longPressTriggeredRef.current = true;
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
        }}
      >
        {/* Accent bar — only for active (running/waiting) sessions */}
        {statusMeta.accentBarClass ? (
          <div className={cn('w-[3px] flex-shrink-0', statusMeta.accentBarClass)} />
        ) : null}

        {/* Card content */}
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col gap-1',
            statusMeta.accentBarClass
              ? 'py-[10px] pl-[11px] pr-[14px]' /* Running/Waiting: offset for accent bar */
              : 'px-[14px] py-[10px]'
          )}
        >
          {/* Title row */}
          <div className="flex items-center gap-2">
            {/* Provider icon + status dot */}
            <div className="relative h-5 w-5 flex-shrink-0">
              <SessionProviderLogo provider={session.provider} className="h-4 w-4" />
              <div
                className={cn(
                  'absolute -bottom-[1px] -right-[1px] h-[7px] w-[7px] rounded-[4px]',
                  statusMeta.dotClass
                )}
              />
            </div>

            {/* Title */}
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-[13px] font-medium',
                statusMeta.titleClass
              )}
            >
              {session.title || session.summary || t('mainContent.untitledSession')}
            </span>

            {/* Time */}
            <span className={cn('flex-shrink-0 text-[11px]', statusMeta.timeClass)}>
              {formatTimeAgo(session.lastActivity, now, t)}
            </span>

            {/* Ellipsis menu trigger */}
            <button
              type="button"
              className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((value) => !value);
              }}
            >
              <MoreHorizontal className="h-[14px] w-[14px] text-[#3a3b3d]" />
            </button>
          </div>

          {/* Sub row — status text */}
          <div className="pl-[28px]">
            <span className={cn('text-[11px]', statusMeta.subTextClass)}>
              {effectiveStatus === 'active'
                ? session.summary || 'Running...'
                : effectiveStatus === 'frozen'
                  ? `Frozen · ${formatTimeAgo(session.lastActivity, now, t)}`
                  : `${statusMeta.subLabel} · ${formatTimeAgo(session.lastActivity, now, t)}`}
            </span>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div className="absolute right-3 top-10 z-30 w-48 rounded-[8px] border border-[#1b1c1e] bg-[#131415] p-1 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
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
              className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-[12px] text-[#e8e9ea] transition hover:bg-[#1a1b1e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 text-[#6a6b6c]" />
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
              className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-[12px] text-[#e8e9ea] transition hover:bg-[#1a1b1e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pause className="h-3.5 w-3.5 text-[#6a6b6c]" />
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
              className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-[12px] text-[#e8e9ea] transition hover:bg-[#1a1b1e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Archive className="h-3.5 w-3.5 text-[#6a6b6c]" />
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
              className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-[12px] text-[#e8e9ea] transition hover:bg-[#1a1b1e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-[#6a6b6c]" />
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
            className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-[12px] text-[#FF6363] transition hover:bg-[#2e1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
