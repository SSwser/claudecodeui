import { Search, X, PanelLeftClose } from 'lucide-react';
import type { TFunction } from 'i18next';
import { cn } from '@/lib/utils';

type SidebarHeaderProps = {
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  onClearSearchFilter: () => void;
  onCollapseSidebar: () => void;
  t: TFunction;
};

/**
 * Brand header (52px) + Search/filter bar (44px).
 * Perfectly aligns horizontally with MainContentHeader (52px + 44px).
 */
export default function SidebarHeader({
  searchFilter,
  onSearchFilterChange,
  onClearSearchFilter,
  onCollapseSidebar,
  t,
}: SidebarHeaderProps) {
  return (
    <div className="flex-shrink-0">
<<<<<<< HEAD
      {/* Brand header — 52px, strictly aligned with MainContent's line */}
      <div className="flex h-[52px] items-center justify-between border-b border-surface-3 px-[14px]">
        <div className="flex items-center gap-2">
          <img
            src="/logo.svg"
            alt="Chorus"
            className="h-[22px] w-[22px] flex-shrink-0 rounded-[5px]"
          />
          <span className="text-[12px] font-semibold tracking-[0.2px] text-foreground">Chorus</span>
        </div>
=======
      {/* Brand header — 56px, bg #101111, subtle bottom shadow */}
      <div
        className="flex h-14 items-center justify-between bg-[#101111] px-[14px]"
        style={{ boxShadow: '0 1px 0 #ffffff08' }}
      >
        <span className="text-[12px] font-semibold tracking-[0.2px] text-[#f9f9f9]">Chorus</span>
>>>>>>> 5cdfe52 (refactor: rename instances of "Claude Code UI" to "Chorus" across the codebase)
        <button
          onClick={onCollapseSidebar}
          className="flex items-center justify-center text-label-dim transition-colors hover:text-foreground"
          aria-label={t('tooltips.hideSidebar')}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Search / filter bar — 44px spacing to perfectly align with Main Content Tabs */}
      <div className="flex h-[44px] items-center border-b border-surface-3 px-3 py-2">
        <label
          className={cn(
            'flex w-full cursor-text flex-shrink-0 items-center gap-1.5 rounded-[6px] px-[10px] py-[6px] transition-all',
            searchFilter ? 'bg-surface-elevated ring-1 ring-border' : 'hover:bg-surface-3/50'
          )}
        >
          <Search
            className={cn(
              'h-[13px] w-[13px] flex-shrink-0 transition-colors',
              searchFilter ? 'text-foreground' : 'text-label-dim'
            )}
          />
          <input
            type="text"
            aria-label={t('projects.searchPlaceholder')}
            placeholder={t('projects.searchPlaceholder')}
            value={searchFilter}
            onChange={(event) => onSearchFilterChange(event.target.value)}
            className="w-full min-w-0 flex-1 border-none bg-transparent text-[12px] text-foreground outline-none transition-colors duration-200 placeholder:text-label-dim"
          />
          {searchFilter && (
            <button
              onClick={onClearSearchFilter}
              aria-label={t('tooltips.clearSearch')}
              className="flex flex-shrink-0 items-center justify-center rounded p-0.5 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
            >
              <X className="h-[10px] w-[10px]" />
            </button>
          )}
        </label>
      </div>
    </div>
  );
}
