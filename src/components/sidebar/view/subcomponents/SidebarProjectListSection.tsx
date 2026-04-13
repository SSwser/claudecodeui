import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Input } from '@/shared/view/ui';
import type { LoadingProgress, Project } from '@/types/app';
import type { SidebarProjectGroup, SidebarProjectListItem } from '@/components/sidebar/types/types';
import StreamRow from './StreamRow';
import StreamDividerHeader from './StreamDividerHeader';
import ProjectContextMenu from './ProjectContextMenu';

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
  onRefreshProject?: () => void;
  onNewSession?: (project: Project) => void;
  onCreateProject: () => void;
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
  onCreateProject,
}: SidebarProjectListSectionProps) {
  const { t } = useTranslation('sidebar');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => new Set());

  const getCollapsedProjectItem = useCallback(
    (group: SidebarProjectGroup) => {
      if (!selectedProject) {
        return group.main;
      }

      if (group.main.project.name === selectedProject.name) {
        return group.main;
      }

      return (
        group.children.find((child) => child.project.name === selectedProject.name) ?? group.main
      );
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
  const renderStreamRow = (projectItem: SidebarProjectListItem, extraStreamCount?: number) => {
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
        onRefresh={() => onRefreshProject?.()}
        onNewSession={() => onNewSession?.(project)}
      >
        <div className={cn(isDeleting && 'pointer-events-none opacity-50')}>
          <StreamRow
            name={projectItem.displayName}
            branch={projectItem.branch}
            status={
              projectItem.hasWaitingSessions
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
                    toggleExpand(project.name);
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
      {/* Projects section header — 36px, border-bottom #16181a */}
      <div className="flex h-9 flex-shrink-0 items-center justify-between border-b border-border-subtle px-[14px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.8px] text-label-dim">
          {t('projects.title')}
        </span>
        <button
          type="button"
          onClick={onCreateProject}
          className="flex h-4 w-4 items-center justify-center rounded bg-surface-3 text-white transition-colors hover:bg-border"
          aria-label={t('projects.newProject')}
        >
          <Plus className="h-[13px] w-[13px]" />
        </button>
      </div>

      {/* Stream list */}
      <div className="min-h-0 flex-1">
        {projects.length === 0 ? (
          <div className="px-4 py-4 text-xs text-dim-foreground">{emptyMessage}</div>
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
            return renderStreamRow(collapsedProject, isMultiStream ? children.length : undefined);
          })
        )}
      </div>
    </section>
  );
}
