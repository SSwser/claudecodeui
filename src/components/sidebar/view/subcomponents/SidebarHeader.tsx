import { useState } from 'react';
import { Plus, Search, X, PanelLeftClose } from 'lucide-react';
import type { TFunction } from 'i18next';
import { cn } from '@/lib/utils';

type SidebarHeaderProps = {
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  onClearSearchFilter: () => void;
  onCreateProject: () => void;
  onCollapseSidebar: () => void;
  t: TFunction;
};

export default function SidebarHeader({
  searchFilter,
  onSearchFilterChange,
  onClearSearchFilter,
  onCreateProject,
  onCollapseSidebar,
  t,
}: SidebarHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const showActiveFilterState = isFocused || searchFilter.length > 0;

  return (
    <div className="flex-shrink-0">
      <div className="flex h-14 items-center justify-between bg-surface-2 px-[14px] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-2">
          <img
            src="/logo.svg"
            alt="Chorus"
            className="h-[22px] w-[22px] flex-shrink-0 rounded-[5px]"
          />
          <span className="text-[12px] font-semibold tracking-[0.2px] text-foreground">Chorus</span>
        </div>
        <button
          type="button"
          onClick={onCollapseSidebar}
          className="flex items-center justify-center text-label-dim transition-colors hover:text-foreground"
          aria-label={t('tooltips.hideSidebar')}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="h-px w-full bg-border" />

      <div className="flex h-9 items-center justify-between border-b border-border px-[14px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.8px] text-label-dim">
          {t('projects.title')}
        </span>
        <button
          type="button"
          onClick={onCreateProject}
          className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-surface-elevated text-label-dim shadow-[0_0_0_1px_hsl(var(--border))] transition-colors hover:text-foreground"
          aria-label={t('projects.newProject')}
        >
          <Plus className="h-[10px] w-[10px]" />
        </button>
      </div>

      <div className="flex h-9 items-center px-3">
        <label
          className={cn(
            'flex h-9 w-full cursor-text flex-shrink-0 items-center gap-1.5 rounded-[4px] px-3 text-muted-foreground transition-all',
            showActiveFilterState
              ? 'bg-background text-foreground shadow-[0_0_0_1px_hsl(var(--brand))]'
              : 'bg-background hover:bg-surface-2'
          )}
        >
          <Search
            className={cn(
              'h-[13px] w-[13px] flex-shrink-0 transition-colors',
              showActiveFilterState ? 'text-foreground' : 'text-label-dim'
            )}
          />
          <input
            type="text"
            aria-label={t('projects.searchPlaceholder')}
            placeholder={t('projects.searchPlaceholder')}
            value={searchFilter}
            onChange={(event) => onSearchFilterChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full min-w-0 flex-1 border-none bg-transparent text-[12px] text-foreground outline-none placeholder:text-label-dim"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={onClearSearchFilter}
              aria-label={t('tooltips.clearSearch')}
              className="flex flex-shrink-0 items-center justify-center rounded-[4px] p-0.5 text-label-dim transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <X className="h-[10px] w-[10px]" />
            </button>
          )}
        </label>
      </div>
    </div>
  );
}
