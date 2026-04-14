import { useCallback, useRef, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { MainContentHeaderProps } from '../../types/types';
import MobileMenuButton from './MobileMenuButton';
import MainContentTabSwitcher from './MainContentTabSwitcher';

export default function MainContentHeader({
  activeTab,
  setActiveTab,
  selectedProject,
  selectedSession,
  shouldShowTasksTab,
  isMobile,
  onMenuClick,
  onCreateSession,
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
    <div className="flex-shrink-0 bg-[#0d0e11]">
      {/* PV/Header — 52px */}
      <div
        className="flex h-[52px] items-center gap-3 px-5"
        style={{ borderBottom: '1px solid #1b1c1e' }}
      >
        {isMobile && <MobileMenuButton onMenuClick={onMenuClick} />}

        {/* Project icon */}
        <div className="h-5 w-5 flex-shrink-0 rounded-[4px] bg-[#6366f1]" />

        {/* Project / session name */}
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#e8e9ea]">
          {selectedSession
            ? (selectedSession.summary as string) || 'New Session'
            : selectedProject.displayName}
        </span>

        {/* + New Session button — project view only */}
        {!selectedSession && onCreateSession && (
          <button
            type="button"
            onClick={onCreateSession}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-[6px] bg-[#1e2024] px-[14px] py-[6px] text-[12px] font-medium text-[#c0c0c0] transition-colors hover:bg-[#252628]"
          >
            <Plus className="h-3 w-3" />
            New Session
          </button>
        )}
      </div>

      {/* PV/Tabs — 44px */}
      <div
        className="flex h-[44px] items-center px-5"
        style={{ borderBottom: '1px solid #1b1c1e' }}
      >
        <div className="relative min-w-0 flex-1 overflow-hidden">
          {canScrollLeft && (
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#0d0e11] to-transparent" />
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
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#0d0e11] to-transparent" />
          )}
        </div>
      </div>
    </div>
  );
}
