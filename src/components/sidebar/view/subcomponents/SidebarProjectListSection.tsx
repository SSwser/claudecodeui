import { useEffect, useMemo, useState } from 'react';
import { Check, FolderOpen, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import { Button, Input } from '../../../../shared/view/ui';
import type { LoadingProgress, Project } from '../../../../types/app';
import type { SidebarProjectListItem } from '../../types/types';

type ContextMenuState = {
  project: Project;
  x: number;
  y: number;
};

type SidebarProjectListSectionProps = {
  projects: SidebarProjectListItem[];
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
  onCreateProject: () => void;
};

function getViewportSafePosition(clientX: number, clientY: number) {
  const width = 188;
  const height = 112;
  const padding = 12;

  const x = Math.min(clientX, window.innerWidth - width - padding);
  const y = Math.min(clientY, window.innerHeight - height - padding);

  return {
    x: Math.max(padding, x),
    y: Math.max(padding, y),
  };
}

export default function SidebarProjectListSection({
  projects,
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
  onCreateProject,
}: SidebarProjectListSectionProps) {
  const { t } = useTranslation('sidebar');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const handleClose = () => setContextMenu(null);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  const emptyMessage = useMemo(() => {
    if (isLoading) {
      if (loadingProgress?.currentProject) {
        return `${t('projects.loadingProjects')} ${loadingProgress.currentProject}`;
      }

      return t('projects.loadingProjects');
    }

    return searchFilter.trim()
      ? t('projects.noMatchingProjects')
      : t('projects.noProjects');
  }, [isLoading, loadingProgress?.currentProject, searchFilter, t]);

  const openContextMenu = (event: Pick<MouseEvent, 'clientX' | 'clientY'>, project: Project) => {
    const { x, y } = getViewportSafePosition(event.clientX, event.clientY);
    setContextMenu({ project, x, y });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col px-3 py-3">
      <div className="mb-3 flex items-center gap-2 px-1">
        <FolderOpen className="h-4 w-4 text-sidebar-foreground/70" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/70">
          {t('projects.title')}
        </h2>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5">
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-sidebar-border/70 bg-sidebar-accent/20 px-3 py-4 text-sm text-sidebar-foreground/65">
            {emptyMessage}
          </div>
        ) : (
          projects.map((projectItem) => {
            const { project } = projectItem;
            const isSelected = selectedProject?.name === project.name;
            const isDeleting = deletingProjects.has(project.name);
            const isEditing = editingProject === project.name;

            return (
              <div
                key={project.name}
                className={cn(
                  'rounded-xl border border-sidebar-border/60 bg-sidebar transition-colors',
                  isSelected && 'border-sidebar-ring bg-sidebar-accent',
                  isDeleting && 'pointer-events-none opacity-50',
                )}
                onContextMenu={(event) => {
                  event.preventDefault();
                  openContextMenu(event.nativeEvent, project);
                }}
              >
                {isEditing ? (
                  <div className="flex items-center gap-2 p-2.5">
                    <Input
                      value={editingName}
                      onChange={(event) => onEditingNameChange(event.target.value)}
                      className="h-9 border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
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
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                      onClick={() => onSaveProjectName(project.name)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      onClick={onCancelEditingProject}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5">
                    <button
                      type="button"
                      onClick={() => onProjectSelect(project)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 text-left text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                    >
                      <span
                        className={cn(
                          'h-2.5 w-2.5 flex-shrink-0 rounded-full',
                          projectItem.hasActiveSessions ? 'bg-emerald-500' : 'bg-slate-400',
                        )}
                        title={t(projectItem.hasActiveSessions ? 'status.active' : 'status.inactive')}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-sidebar-foreground">
                          {projectItem.displayName}
                        </p>
                        <p className="truncate text-xs text-sidebar-foreground/60">
                          {projectItem.workspaceName}
                        </p>
                      </div>
                    </button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      onClick={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        openContextMenu({ clientX: rect.right, clientY: rect.bottom }, project);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full justify-center gap-2 border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={onCreateProject}
      >
        <Plus className="h-4 w-4" />
        {t('projects.newProject')}
      </Button>

      {contextMenu ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[75] cursor-default"
            onClick={() => setContextMenu(null)}
            aria-label="Close project menu"
          />
          <div
            className="fixed z-[76] min-w-44 rounded-2xl border border-sidebar-border bg-popover p-1.5 shadow-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              onClick={() => {
                onStartEditingProject(contextMenu.project);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
            >
              <Pencil className="h-4 w-4" />
              {t('actions.rename')}
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteProject(contextMenu.project);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" />
              {t('actions.delete')}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}