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
      className="group flex h-6 w-full cursor-pointer items-center gap-2 px-4 transition-colors hover:bg-muted"
    >
      {/* Left rule */}
      <span className="h-px w-2 flex-shrink-0 bg-[#434345]" />

      {/* Project name */}
      <span className="flex-shrink-0 truncate text-[11px] font-medium text-[#434345]">{name}</span>

      {/* Right rule — fills remaining space */}
      <span className="h-px min-w-0 flex-1 bg-[#434345]" />

      {/* Collapse chevron — hover-only visibility per brief */}
      <ChevronUp className="h-3 w-3 flex-shrink-0 text-[#434345] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
