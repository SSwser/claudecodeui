import { GitBranch } from 'lucide-react';
import { cn } from '../../../../lib/utils';

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

export default function StreamRow({
  name,
  branch,
  status,
  runningCount = 0,
  waitingCount = 0,
  extraStreamCount,
  timestamp,
  isSelected = false,
  onClick,
  onBadgeClick,
}: StreamRowProps) {
  const isFresh = status === 'fresh';
  const hasSubtitle = !isFresh;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-start gap-3 px-4 text-left transition-colors',
        hasSubtitle ? 'py-2.5' : 'py-2',
        isSelected ? 'bg-surface-2' : 'hover:bg-muted'
      )}
    >
      {/* Selected indicator bar */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand" />
      )}

      {/* Status dot — 6×6px */}
      <span
        className={cn('mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full', getDotColor(status))}
      />

      {/* Content area */}
      <div className="min-w-0 flex-1">
        {/* Top row: name + timestamp/!N */}
        <div className="flex items-center justify-between gap-2">
          {/* Name: flex-1 + min-w-0 + truncate handles overflow naturally without a pixel hard-stop */}
          <span
            className={cn(
              'flex-1 truncate text-xs font-medium tracking-[0.2px]',
              isSelected ? 'text-foreground' : isFresh ? 'text-muted-foreground' : 'text-[#cecece]'
            )}
          >
            {name}
          </span>

          <div className="flex flex-shrink-0 items-center gap-1.5">
            {/* !N badge — sessions awaiting user reply.
                Must be a button (not a span) for keyboard accessibility.
                Rendered outside the row's main click target via pointer-events. */}
            {waitingCount > 0 && (
              <button
                type="button"
                aria-label={`${waitingCount} session${waitingCount > 1 ? 's' : ''} waiting for reply`}
                className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onBadgeClick?.(e);
                }}
              >
                !{waitingCount}
              </button>
            )}

            {/* Timestamp (idle only, top-right) */}
            {!isFresh && status === 'idle' && timestamp && (
              <span className="text-[11px] text-muted-foreground">{timestamp}</span>
            )}
          </div>
        </div>

        {/* Subtitle row: branch chip + running indicator */}
        {hasSubtitle && (
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {/* Branch tag — border-only chip */}
              {branch && (
                <span
                  className="inline-flex max-w-[120px] items-center gap-1 truncate rounded border border-[#434345] bg-muted px-1.5 py-px font-mono text-[11px] text-muted-foreground"
                  title={branch}
                >
                  <GitBranch className="h-2.5 w-2.5 flex-shrink-0 text-[#434345]" />
                  <span className="truncate">{branch}</span>
                </span>
              )}

              {/* +N badge for multi-stream collapsed — border matches branch chip for visual consistency */}
              {extraStreamCount != null && extraStreamCount > 0 && (
                <span
                  className="inline-flex cursor-pointer items-center rounded border border-[#434345] bg-muted px-1 py-px font-mono text-[11px] text-[#9c9c9d]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBadgeClick?.(e);
                  }}
                >
                  +{extraStreamCount}
                </span>
              )}
            </div>

            {/* Running indicator */}
            {runningCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-warning">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
                {runningCount} running
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
