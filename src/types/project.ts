export interface Project {
  id: number;
  name: string;
  displayName: string | null;
  directoryPath: string;
  multiWorkspaceEnabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: number;
  projectId: number;
  name: string;
  worktreePath: string | null;
  worktreeBranch: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface ProjectCreatePayload {
  name: string;
  directoryPath: string;
  multiWorkspaceEnabled?: boolean;
}

export interface WorkspaceCreatePayload {
  name: string;
  worktreeBranch?: string;
}
