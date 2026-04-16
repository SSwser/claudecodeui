import { Activity, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Stream Row — the atomic sidebar navigation element (design brief §2).
 *
 * Layout:
 *   [dot]  [name]                     [timestamp or !N]
 *          ┌ branch ┐                 [running indicator]
 */

type StreamRowProps = {
  /** Stream / project display name */
  name: string;
  /** Git branch name (shown as border-only chip) */
  branch?: string;
  /** Status: running-waiting | running | idle | fresh */
  status: 'running-waiting' | 'running' | 'idle' | 'fresh';
  /** Number of running sessions (shown as "● N running") */
  runningCount?: number;
  /** Number of sessions waiting for user reply */
  waitingCount?: number;
  /** Additional stream count for multi-stream collapsed ("+N") */
  extraStreamCount?: number;
  /** Relative timestamp (e.g. "3h ago", "just now") */
  timestamp?: string;
  /** Whether this row is currently selected */
  isSelected?: boolean;
  /** True when the worktree backing this stream no longer exists. */
  isStale?: boolean;
  onClick?: () => void;
  onBadgeClick?: (e: React.MouseEvent) => void;
};

/** Dot color per state — design brief §2.3 */
function getDotColor(status: StreamRowProps['status']) {
  switch (status) {
    case 'running-waiting':
      return 'bg-brand';
    case 'running':
      return 'bg-warning';
    case 'idle':
    case 'fresh':
    default:
      return 'bg-muted-foreground';
  }
}

function runInlineAction(
  event: React.MouseEvent | React.KeyboardEvent,
  callback?: (event: React.MouseEvent) => void
) {
  event.stopPropagation();

  if ('key' in event) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
  }

  callback?.(event as unknown as React.MouseEvent);
}

export default function StreamRow({
  name,
  branch,
  status,
  runningCount = 0,
  waitingCount = 0,
  extraStreamCount,
  timestamp,
  isSelected = false,
  isStale = false,
  onClick,
  onBadgeClick,
}: StreamRowProps) {
  const isFresh = status === 'fresh';
  const hasSubtitle = !isFresh;
  const rowFrameClass = isSelected
    ? 'bg-surface-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
    : 'hover:bg-surface-2 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex min-h-[44px] w-full items-start gap-[6px] px-[14px] py-[6px] pl-3 text-left transition-[background-color,box-shadow]',
        hasSubtitle ? 'justify-start' : 'items-center',
        rowFrameClass
      )}
    >
      <span
        className={cn(
          hasSubtitle ? 'mt-[5px]' : 'mt-0',
          'h-1.5 w-1.5 flex-shrink-0 rounded-[3px]',
          getDotColor(status)
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'flex-1 truncate text-[11px] leading-[1.2] tracking-[0.2px]',
              isStale
                ? 'text-muted-foreground line-through decoration-muted-foreground/70'
                : isSelected
                  ? 'font-medium text-foreground'
                  : isFresh
                    ? 'text-muted-foreground'
                    : 'font-medium text-foreground'
            )}
          >
            {name}
          </span>

          <div className="flex flex-shrink-0 items-center gap-1.5">
            {isStale ? (
              <span className="inline-flex items-center rounded-[3px] bg-surface-3 px-[6px] py-px text-[10px] text-muted-foreground">
                Unavailable
              </span>
            ) : null}

            {waitingCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                aria-label={`${waitingCount} session${waitingCount > 1 ? 's' : ''} waiting for reply`}
                className="inline-flex h-4 min-w-4 items-center justify-center rounded-[999px] bg-brand px-1 text-[10px] font-medium text-white"
                onClick={(e) => runInlineAction(e, onBadgeClick)}
                onKeyDown={(e) => runInlineAction(e, onBadgeClick)}
              >
                !{waitingCount}
              </span>
            )}

            {!isFresh && status === 'idle' && timestamp && (
              <span className="text-[10px] text-label-dim">{timestamp}</span>
            )}
          </div>
        </div>

        {hasSubtitle && (
          <div className="mt-[3px] flex items-center justify-between gap-[5px] pl-3">
            <div className="flex items-center gap-1">
              {branch && (
                <span
                  className="inline-flex max-w-[120px] items-center gap-[2px] truncate rounded-[3px] bg-surface-3 px-[6px] py-px text-[10px] leading-[1.3] text-muted-foreground"
                  title={branch}
                >
                  <GitBranch
                    className={cn(
                      'h-[10px] w-[10px] flex-shrink-0',
                      isStale ? 'text-muted-foreground/60' : 'text-label-dim'
                    )}
                  />
                  <span className="truncate">{branch}</span>
                </span>
              )}

              {extraStreamCount != null && extraStreamCount > 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  className="inline-flex cursor-pointer items-center rounded-[3px] bg-surface-3 px-[6px] py-px text-[10px] font-medium leading-[1.3] text-muted-foreground transition-colors hover:text-foreground"
                  style={{ fontFamily: 'GeistMono' }}
                  onClick={(e) => runInlineAction(e, onBadgeClick)}
                  onKeyDown={(e) => runInlineAction(e, onBadgeClick)}
                >
                  +{extraStreamCount}
                </span>
              )}
            </div>

            {runningCount > 0 && (
              <span className="flex items-center gap-[2px] text-[10px] leading-none">
                <Activity className="h-[10px] w-[10px] text-warning" />
                <span className="text-warning">{runningCount} running</span>
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
