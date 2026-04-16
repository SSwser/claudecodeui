import type { TFunction } from 'i18next';
import SidebarFooter from './SidebarFooter';
import SidebarHeader from './SidebarHeader';
import SidebarProjectListSection from './SidebarProjectListSection';
import GlobalRecentSection from '@/components/sidebar/view/subcomponents/GlobalRecentSection';
import { ScrollArea } from '@/shared/view/ui';
import type { LoadingProgress, Project } from '@/types/app';
import type { ReleaseInfo } from '@/types/sharedTypes';
import type {
  SidebarProjectGroup,
  SidebarProjectListItem,
  SidebarRecentSession,
} from '@/components/sidebar/types/types';

type SidebarContentProps = {
  isLoading: boolean;
  loadingProgress: LoadingProgress | null;
  projects: Project[];
  selectedProject: Project | null;
  recentSessions: SidebarRecentSession[];
  sidebarProjects: SidebarProjectListItem[];
  groupedProjects: SidebarProjectGroup[];
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  onClearSearchFilter: () => void;
  onCreateProject: () => void;
  editingProject: string | null;
  editingName: string;
  deletingProjects: Set<string>;
  onEditingNameChange: (value: string) => void;
  onProjectSelect: (project: Project) => void;
  onStartEditingProject: (project: Project) => void;
  onCancelEditingProject: () => void;
  onSaveProjectName: (projectName: string) => void;
  onDeleteProject: (project: Project) => void;
  onRefreshProject?: (project: Project) => void;
  onNewSession?: (project: Project) => void;
  onRecentSessionSelect: (recentSession: SidebarRecentSession) => void;
  onNavigateToHistory: () => void;
  onCollapseSidebar: () => void;
  updateAvailable: boolean;
  releaseInfo: ReleaseInfo | null;
  latestVersion: string | null;
  onShowVersionModal: () => void;
  onShowSettings: () => void;
  t: TFunction;
};

/**
 * Sidebar expanded content — 240px wide (design brief §1).
 *
 * Layout:
 *   Brand header (56px)
 *   Search / filter bar (36px)
 *   Projects section header (36px) + Stream list (flex-1 scroll)
 *   ─── pinned bottom ───
 *   RECENT section (fixed)
 *   [gap 12px]
 *   Update chip (conditional)
 *   Plugins (36px)
 *   Settings (36px)
 */
export default function SidebarContent({
  isLoading,
  loadingProgress,
  selectedProject,
  recentSessions,
  sidebarProjects,
  groupedProjects,
  searchFilter,
  onSearchFilterChange,
  onClearSearchFilter,
  onCreateProject,
  editingProject,
  editingName,
  deletingProjects,
  onEditingNameChange,
  onProjectSelect,
  onStartEditingProject,
  onCancelEditingProject,
  onSaveProjectName,
  onDeleteProject,
  onRefreshProject,
  onNewSession,
  onRecentSessionSelect,
  onNavigateToHistory,
  onCollapseSidebar,
  updateAvailable,
  releaseInfo,
  latestVersion,
  onShowVersionModal,
  onShowSettings,
  t,
}: SidebarContentProps) {
  return (
    <div data-testid="sidebar" className="flex h-full w-60 select-none flex-col bg-background">
      {/* Brand header + Search bar */}
      <SidebarHeader
        searchFilter={searchFilter}
        onSearchFilterChange={onSearchFilterChange}
        onClearSearchFilter={onClearSearchFilter}
        onCreateProject={onCreateProject}
        onCollapseSidebar={onCollapseSidebar}
        t={t}
      />

      {/* Stream list — scrollable area */}
      <ScrollArea className="flex-1 overflow-y-auto overscroll-contain">
        <SidebarProjectListSection
          projects={sidebarProjects}
          groupedProjects={groupedProjects}
          selectedProject={selectedProject}
          isLoading={isLoading}
          loadingProgress={loadingProgress}
          searchFilter={searchFilter}
          editingProject={editingProject}
          editingName={editingName}
          deletingProjects={deletingProjects}
          onEditingNameChange={onEditingNameChange}
          onProjectSelect={onProjectSelect}
          onStartEditingProject={onStartEditingProject}
          onCancelEditingProject={onCancelEditingProject}
          onSaveProjectName={onSaveProjectName}
          onDeleteProject={onDeleteProject}
          onRefreshProject={onRefreshProject}
          onNewSession={onNewSession}
        />
      </ScrollArea>

      {/* Pinned at bottom: RECENT + bottom stack */}
      <div className="flex-shrink-0">
        <GlobalRecentSection
          sessions={recentSessions}
          onSessionSelect={onRecentSessionSelect}
          onNavigateToHistory={onNavigateToHistory}
        />

        <SidebarFooter
          updateAvailable={updateAvailable}
          releaseInfo={releaseInfo}
          latestVersion={latestVersion}
          onShowVersionModal={onShowVersionModal}
          onShowSettings={onShowSettings}
          t={t}
        />
      </div>
    </div>
  );
}
