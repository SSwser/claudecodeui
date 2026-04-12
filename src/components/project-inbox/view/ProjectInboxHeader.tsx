import { ArrowUpDown, Plus, Search, Workflow } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Pill, PillBar } from '../../../shared/view/ui';
import type {
  InboxSortOrder,
  InboxStatusFilter,
  ProjectInboxProject,
  ProjectInboxWorkspace,
} from '../types/types';

type ProjectInboxHeaderProps = {
  project: ProjectInboxProject | null;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusFilter: InboxStatusFilter;
  onStatusFilterChange: (value: InboxStatusFilter) => void;
  sortOrder: InboxSortOrder;
  onSortOrderChange: (value: InboxSortOrder) => void;
  workspaces: ProjectInboxWorkspace[];
  selectedWorkspaceId: number | null;
  onWorkspaceChange: (value: number | null) => void;
  onCreateSession: () => void;
};

const STATUS_FILTERS: Array<{ value: InboxStatusFilter; label: string }> = [
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
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
  workspaces,
  selectedWorkspaceId,
  onWorkspaceChange,
  onCreateSession,
}: ProjectInboxHeaderProps) {
  return (
    <div className="rounded-large border border-border/70 bg-card/95 p-4 shadow-ring sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Project Inbox
          </p>
          <h2 className="truncate text-xl font-semibold text-foreground">
            {project?.displayName || project?.name || 'Project'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Search, triage, and reopen sessions without leaving the main workspace surface.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {project?.multiWorkspaceEnabled ? (
            <div className="min-w-[220px] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <Workflow className="h-3.5 w-3.5" />
                Workspace
              </div>
              <Select
                value={selectedWorkspaceId ? String(selectedWorkspaceId) : 'all'}
                onValueChange={(value) => onWorkspaceChange(value === 'all' ? null : Number(value))}
                options={[
                  { value: 'all', label: 'All workspaces' },
                  ...workspaces.map((workspace) => ({
                    value: String(workspace.id),
                    label: workspace.name,
                  })),
                ]}
              />
            </div>
          ) : null}

          <Button type="button" onClick={onCreateSession} className="min-w-[140px]">
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search sessions by title or recent context"
            className="pl-9"
          />
        </label>

        <div className="flex items-center gap-2 rounded-medium border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
          <ArrowUpDown className="h-4 w-4" />
          <Select
            value={sortOrder}
            onValueChange={(value) => onSortOrderChange(value as InboxSortOrder)}
            options={SORT_OPTIONS}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PillBar className="flex-wrap gap-2 bg-transparent p-0">
          {STATUS_FILTERS.map((filter) => (
            <Pill
              key={filter.value}
              isActive={statusFilter === filter.value}
              onClick={() => onStatusFilterChange(filter.value)}
              className="rounded-pill border border-border/70 px-3 py-1.5 text-xs"
            >
              {filter.label}
            </Pill>
          ))}
        </PillBar>
      </div>
    </div>
  );
}