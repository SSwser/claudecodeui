import { useCallback, useRef, useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import MobileMenuButton from './MobileMenuButton';
import MainContentTabSwitcher from './MainContentTabSwitcher';
import { cn } from '@/lib/utils';
import type { MainContentHeaderProps } from '@/components/main-content/types/types';

export default function MainContentHeader({
  activeTab,
  setActiveTab,
  selectedProject,
  selectedSession,
  shouldShowTasksTab,
  isMobile,
  onMenuClick,
  onCreateSession,
  runningCount = 0,
  waitingCount = 0,
  searchQuery = '',
  onSearchQueryChange,
}: MainContentHeaderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollState]);

  return (
    <div className="flex-shrink-0 bg-card">
      {/* PV/Header — 52px */}
      <div className="flex h-[52px] items-center gap-3 border-b border-surface-3 px-5">
        {isMobile && <MobileMenuButton onMenuClick={onMenuClick} />}

        {/* Project icon */}
        <div className="h-5 w-5 flex-shrink-0 rounded-[4px] bg-workspace-accent" />

        {/* Project / session name */}
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">
          {selectedSession
            ? (selectedSession.summary as string) || 'New Session'
            : selectedProject.displayName}
        </span>

        {/* Change A: status pills — project view only, shown when there is activity */}
        {!selectedSession && (runningCount > 0 || waitingCount > 0) && (
          <div className="flex flex-shrink-0 items-center gap-[6px] rounded-[5px] bg-surface-elevated px-[10px] py-[3px]">
            {runningCount > 0 && (
              <>
                <span className="h-[6px] w-[6px] rounded-full bg-warning" />
                <span className="text-[11px] font-medium leading-none text-warning">
                  {runningCount}
                </span>
              </>
            )}
            {runningCount > 0 && waitingCount > 0 && <div className="h-[10px] w-px bg-surface-3" />}
            {waitingCount > 0 && (
              <>
                <span className="h-[6px] w-[6px] rounded-full bg-brand" />
                <span className="text-[11px] font-medium leading-none text-brand">
                  {waitingCount}
                </span>
              </>
            )}
          </div>
        )}

        {/* + New Session button — project view only */}
        {!selectedSession && onCreateSession && (
          <button
            type="button"
            onClick={onCreateSession}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-[6px] bg-secondary px-[14px] py-[6px] text-[12px] font-medium text-muted-foreground transition-colors hover:bg-border"
          >
            <Plus className="h-3 w-3" />
            New Session
          </button>
        )}
      </div>

      {/* PV/Tabs — 44px */}
      <div className="flex h-[44px] items-center border-b border-surface-3 px-5">
        <div className="relative min-w-0 flex-1 overflow-hidden">
          {canScrollLeft && (
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-canvas to-transparent" />
          )}
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="scrollbar-hide overflow-x-auto"
          >
            <MainContentTabSwitcher
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              shouldShowTasksTab={shouldShowTasksTab}
              isProjectView={!selectedSession}
            />
          </div>
          {canScrollRight && (
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-canvas to-transparent" />
          )}
        </div>

        {/* Change B: ghost search — project view, Sessions tab only */}
        {!selectedSession && activeTab === 'chat' && (
          <label
            className={cn(
              'ml-2 flex flex-shrink-0 cursor-text items-center gap-1.5 rounded-[6px] px-[10px] py-[6px] transition-all',
              searchQuery ? 'bg-surface-elevated ring-1 ring-border' : 'hover:bg-surface-3/50'
            )}
          >
            <Search
              className={cn(
                'h-[13px] w-[13px] flex-shrink-0 transition-colors',
                searchQuery ? 'text-foreground' : 'text-label-dim'
              )}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange?.(e.target.value)}
              placeholder="Search sessions…"
              className={cn(
                'border-none bg-transparent text-[12px] text-foreground outline-none transition-[width] duration-200 ease-out',
                'placeholder:text-label-dim',
                searchQuery ? 'w-[200px]' : 'w-[140px] focus:w-[200px]'
              )}
            />
          </label>
        )}
      </div>
    </div>
  );
}
