import type { ProjectSession } from '@/types/app';
import type { SessionState, SessionStatus } from '@/types/session';

export type ProjectInboxProps = {
  projectId: number;
  projectName?: string;
  projectDisplayName?: string;
  /** Pre-select this workspace when the inbox first loads.  Set by the
   *  sidebar when the user clicks a specific stream row in a multi-workspace
   *  project so the inbox immediately shows that worktree's sessions. */
  initialWorkspaceId?: number;
  /** When the selected stream is already known to be stale, show the stale
   *  resolution panel up front instead of waiting for the project load cycle. */
  initialWorkspaceIsStale?: boolean;
  /** Label for the stale stream when the inbox is still loading project data.
   *  This is typically the folder name from the path, not the git branch. */
  initialWorkspaceLabel?: string;
  /** Controlled search query lifted to MainContent so the ghost search in
   *  the tabs row and the inbox list stay in sync. When provided the inbox
   *  uses this value instead of its internal state. */
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onOpenSession: (session: ProjectSession) => void;
  onCreateSession: () => void;
};

export type SessionCardProps = {
  session: SessionState & { workspaceName?: string | null };
  onSelect: (session: SessionState & { workspaceName?: string | null }) => void;
  onFreeze?: (session: SessionState & { workspaceName?: string | null }) => void;
  onResume?: (session: SessionState & { workspaceName?: string | null }) => void;
  onArchive?: (session: SessionState & { workspaceName?: string | null }) => void;
  onDelete?: (session: SessionState & { workspaceName?: string | null }) => void;
  onRename?: (session: SessionState & { workspaceName?: string | null }) => void;
  actionsEnabled?: Partial<Record<'freeze' | 'resume' | 'archive' | 'rename' | 'delete', boolean>>;
};

export type InboxStatusFilter = 'all' | SessionStatus;

export type InboxSortOrder = 'recent' | 'name' | 'created';

export type ProjectInboxWorkspace = {
  id: number;
  name: string;
  isDefault: boolean;
  worktreeBranch: string | null;
  worktreePath: string | null;
  status?: 'active' | 'archived';
  isStale?: boolean;
  staleDetectedAt?: string | null;
  archivedAt?: string | null;
};

export type ProjectInboxProject = {
  id: number;
  name: string;
  displayName: string | null;
  directoryPath: string;
  multiWorkspaceEnabled: boolean;
  workspaces: ProjectInboxWorkspace[];
};
