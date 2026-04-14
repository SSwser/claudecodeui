import { Activity, GitBranch } from 'lucide-react';
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
        'group relative flex w-full items-start gap-[6px] text-left transition-colors',
        hasSubtitle ? 'px-[14px] py-[6px] pl-3' : 'h-10 px-[14px] pl-3',
        isSelected ? 'bg-[#101111]' : 'hover:bg-[#0d0e10]'
      )}
    >
      {/* Status dot — 6×6px, cornerRadius 3 */}
      <span
        className={cn('mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-[3px]', getDotColor(status))}
      />

      {/* Content area */}
      <div className="min-w-0 flex-1">
        {/* Top row: name + timestamp/!N */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'flex-1 truncate text-[12px] tracking-[0.2px]',
              isSelected
                ? 'font-medium text-[#cecece]'
                : isFresh
                  ? 'text-[#6a6b6c]'
                  : 'font-medium text-[#cecece]'
            )}
          >
            {name}
          </span>

          <div className="flex flex-shrink-0 items-center gap-1.5">
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

            {!isFresh && status === 'idle' && timestamp && (
              <span className="text-[11px] text-[#6a6b6c]">{timestamp}</span>
            )}
          </div>
        </div>

        {/* Subtitle row: branch chip + running indicator */}
        {hasSubtitle && (
          <div className="mt-1 flex items-center justify-between gap-[5px] pl-3">
            <div className="flex items-center gap-1">
              {/* Branch tag — filled chip, no border */}
              {branch && (
                <span
                  className="inline-flex max-w-[120px] items-center gap-[2px] truncate rounded bg-[#1b1c1e] px-[6px] py-[2px] text-[11px] text-[#9a9b9c]"
                  title={branch}
                >
                  <GitBranch className="h-[10px] w-[10px] flex-shrink-0 text-[#434345]" />
                  <span className="truncate">{branch}</span>
                </span>
              )}

              {/* +N badge — Geist Mono, filled chip */}
              {extraStreamCount != null && extraStreamCount > 0 && (
                <span
                  className="inline-flex cursor-pointer items-center rounded bg-[#1c1d20] px-[6px] py-[2px] font-mono text-[11px] font-medium text-[#9a9b9c]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBadgeClick?.(e);
                  }}
                >
                  +{extraStreamCount}
                </span>
              )}
            </div>

            {/* Running indicator — activity icon + count */}
            {runningCount > 0 && (
              <span className="flex items-center gap-[2px] text-[10px]">
                <Activity className="h-[10px] w-[10px] text-[#e5a700]" />
                <span className="text-[#fbbf24]">{runningCount} running</span>
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
