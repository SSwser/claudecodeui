import type {
  InboxSortOrder,
  InboxStatusFilter,
  ProjectInboxProject,
  ProjectInboxWorkspace,
} from '../types/types';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

type ProjectInboxHeaderProps = {
  project: ProjectInboxProject | null;
  statusFilter: InboxStatusFilter;
  onStatusFilterChange: (value: InboxStatusFilter) => void;
  sortOrder: InboxSortOrder;
  onSortOrderChange: (value: InboxSortOrder) => void;
  workspaces: ProjectInboxWorkspace[];
  selectedWorkspaceId: number | null;
  onWorkspaceChange: (value: number | null) => void;
  onCreateSession: () => void;
};

const STATUS_OPTIONS: Array<{ value: InboxStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'name', label: 'Name' },
  { value: 'created', label: 'Created' },
];

export default function ProjectInboxHeader({
  project,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
  workspaces,
  selectedWorkspaceId,
  onWorkspaceChange,
  onCreateSession,
}: ProjectInboxHeaderProps) {
  const workspaceOptions = workspaces.map((workspace) => ({
    value: String(workspace.id),
    label: workspace.name,
  }));

  return (
    <div className="z-50 flex flex-shrink-0 flex-col gap-3 border-b border-border-subtle bg-canvas px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {project?.displayName || project?.name || 'Project inbox'}
          </h2>
          <p className="text-xs text-muted-foreground">Review, reopen, and triage your sessions.</p>
        </div>

        {workspaces.length > 1 ? (
          <Select
            value={selectedWorkspaceId ? String(selectedWorkspaceId) : ''}
            onValueChange={(value) => onWorkspaceChange(value ? Number(value) : null)}
            options={workspaceOptions}
            className="w-[160px]"
            triggerClassName="h-8 rounded-[8px] bg-card px-3 text-xs shadow-none"
            ariaLabel="Switch active workspace"
          />
        ) : null}

        <Button type="button" size="sm" onClick={onCreateSession}>
          New Session
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(val) => onStatusFilterChange(val as InboxStatusFilter)}
          options={STATUS_OPTIONS}
          className="w-[100px]"
          triggerClassName="h-7 rounded-[6px] border-none bg-card px-2 text-[11px] shadow-none"
          ariaLabel="Filter sessions by status"
        />

        <Select
          value={sortOrder}
          onValueChange={(val) => onSortOrderChange(val as InboxSortOrder)}
          options={SORT_OPTIONS}
          className="w-[100px]"
          triggerClassName="h-7 rounded-[6px] border-none bg-card px-2 text-[11px] shadow-none"
          ariaLabel="Change session sort order"
        />
      </div>
    </div>
  );
}
