import { ChevronUp } from 'lucide-react';

/**
 * Multi-stream expanded divider header (design brief §3.3).
 *
 * Format: ─ name ──────────────── [∧]
 * 24px height, full-row clickable, collapses multi-stream back to +N row.
 */

type StreamDividerHeaderProps = {
  name: string;
  onClick: () => void;
};

export default function StreamDividerHeader({ name, onClick }: StreamDividerHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-6 w-full cursor-pointer items-center gap-[6px] py-0 pl-3 pr-[14px] transition-colors hover:bg-canvas"
    >
      {/* Left rule */}
      <span className="h-px w-5 flex-shrink-0 bg-label-dim" />

      {/* Project name */}
      <span className="flex-shrink-0 truncate text-[11px] font-medium text-label-dim">{name}</span>

      {/* Right rule — fills remaining space */}
      <span className="h-px min-w-0 flex-1 bg-label-dim" />

      {/* Collapse chevron */}
      <ChevronUp className="h-3 w-3 flex-shrink-0 text-label-dim" />
    </button>
  );
}
