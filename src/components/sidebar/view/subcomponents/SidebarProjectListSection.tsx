import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StreamRow from './StreamRow';
import StreamDividerHeader from './StreamDividerHeader';
import ProjectContextMenu from './ProjectContextMenu';
import { cn } from '@/lib/utils';
import { Input } from '@/shared/view/ui';
import type { LoadingProgress, Project } from '@/types/app';
import type { SidebarProjectGroup, SidebarProjectListItem } from '@/components/sidebar/types/types';

type SidebarProjectListSectionProps = {
  projects: SidebarProjectListItem[];
  groupedProjects: SidebarProjectGroup[];
  selectedProject: Project | null;
  isLoading: boolean;
  loadingProgress: LoadingProgress | null;
  searchFilter: string;
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
};

export default function SidebarProjectListSection({
  projects,
  groupedProjects,
  selectedProject,
  isLoading,
  loadingProgress,
  searchFilter,
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
}: SidebarProjectListSectionProps) {
  const { t } = useTranslation('sidebar');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => new Set());

  const getCollapsedProjectItem = useCallback(
    (group: SidebarProjectGroup) => {
      if (!selectedProject) {
        return group.main;
      }

      const selectedStream =
        group.main.project.name === selectedProject.name
          ? group.main
          : group.children.find((child) => child.project.name === selectedProject.name);

      if (!selectedStream) {
        return group.main;
      }

      // Keep the repo title anchored to the group's main stream when collapsed.
      // Only the branch chip and activity state should follow the active child stream.
      return selectedStream === group.main
        ? group.main
        : { ...selectedStream, displayName: group.main.displayName };
    },
    [selectedProject]
  );

  const toggleExpand = useCallback((projectName: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectName)) {
        next.delete(projectName);
      } else {
        next.add(projectName);
      }
      return next;
    });
  }, []);

  const emptyMessage = useMemo(() => {
    if (isLoading) {
      if (loadingProgress?.currentProject) {
        return `${t('projects.loadingProjects')} ${loadingProgress.currentProject}`;
      }

      return t('projects.loadingProjects');
    }

    return searchFilter.trim() ? t('projects.noMatchingProjects') : t('projects.noProjects');
  }, [isLoading, loadingProgress?.currentProject, searchFilter, t]);

  /**
   * Render a single stream row, handling editing and context-menu states.
   * `extraStreamCount` is passed only for multi-stream collapsed rows (§3.2).
   */
  const renderStreamRow = (
    projectItem: SidebarProjectListItem,
    extraStreamCount?: number,
    expandProjectName?: string
  ) => {
    const { project } = projectItem;
    const isSelected = selectedProject?.name === project.name;
    const isDeleting = deletingProjects.has(project.name);
    const isEditing = editingProject === project.name;

    if (isEditing) {
      return (
        <div key={project.name} className="flex items-center gap-2 px-4 py-2">
          <Input
            value={editingName}
            onChange={(event) => onEditingNameChange(event.target.value)}
            className="h-8 flex-1 border-label-dim bg-muted text-xs text-foreground"
            placeholder={t('projects.projectNamePlaceholder')}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSaveProjectName(project.name);
              }
              if (event.key === 'Escape') {
                onCancelEditingProject();
              }
            }}
          />
        </div>
      );
    }

    return (
      <ProjectContextMenu
        key={project.name}
        project={project}
        onRename={() => onStartEditingProject(project)}
        onDelete={() => onDeleteProject(project)}
        onRefresh={() => onRefreshProject?.(project)}
        onNewSession={() => onNewSession?.(project)}
      >
        <div className={cn(isDeleting && 'pointer-events-none opacity-50')}>
          <StreamRow
            name={projectItem.displayName}
            branch={projectItem.branch}
            isStale={projectItem.isStale}
            status={
              projectItem.isStale
                ? 'idle'
                : projectItem.hasWaitingSessions
                  ? 'running-waiting'
                  : projectItem.hasActiveSessions
                    ? 'running'
                    : 'idle'
            }
            isSelected={isSelected}
            extraStreamCount={extraStreamCount}
            onClick={() => onProjectSelect(project)}
            onBadgeClick={
              extraStreamCount != null
                ? (e) => {
                    e.stopPropagation();
                    toggleExpand(expandProjectName || project.name);
                  }
                : undefined
            }
          />
        </div>
      </ProjectContextMenu>
    );
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
        {projects.length === 0 ? (
          <div className="px-[14px] py-4 text-[11px] text-label-dim">{emptyMessage}</div>
        ) : (
          groupedProjects.map((group) => {
            const { main, children } = group;
            const isMultiStream = children.length > 0;
            const isExpanded = isMultiStream && expandedProjects.has(main.project.name);
            const collapsedProject = getCollapsedProjectItem(group);

            if (isMultiStream && isExpanded) {
              // §3.3 — Expanded: divider header + main row + child stream rows
              return (
                <div key={main.project.name}>
                  <StreamDividerHeader
                    name={main.displayName}
                    onClick={() => toggleExpand(main.project.name)}
                  />
                  {/* Main stream row */}
                  {renderStreamRow(main)}
                  {/* Child stream rows — flush with normal rows, no indent */}
                  {children.map((child) => renderStreamRow(child))}
                </div>
              );
            }

            // §3.1 / §3.2 — Single-stream or collapsed multi-stream
            return renderStreamRow(
              collapsedProject,
              isMultiStream ? children.length : undefined,
              isMultiStream ? main.project.name : undefined
            );
          })
        )}
      </div>
    </section>
  );
}
