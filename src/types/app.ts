import type { SessionStatus } from './session';

export type SessionProvider = 'claude' | 'cursor' | 'codex' | 'gemini';

export type AppTab = 'chat' | 'files' | 'shell' | 'git' | 'tasks' | 'preview' | `plugin:${string}`;

export type AppShellTabKind = 'session';

export type AppShellTab = {
  id: string;
  kind: AppShellTabKind;
  label: string;
  sessionId: string | null;
  projectName: string | null;
};

export interface ProjectSession {
  id: string;
  title?: string;
  summary?: string;
  name?: string;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
  lastActivity?: string;
  messageCount?: number;
  __provider?: SessionProvider;
  __projectName?: string;
  [key: string]: unknown;
}

export interface ProjectSessionMeta {
  total?: number;
  hasMore?: boolean;
  [key: string]: unknown;
}

export interface ProjectTaskmasterInfo {
  hasTaskmaster?: boolean;
  status?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Project {
  id?: number;
  name: string;
  displayName: string;
  fullPath: string;
  path?: string;
  directoryPath?: string;
  multiWorkspaceEnabled?: boolean;
  activeSessionCount?: number;
  workspaceCount?: number;
  workspaces?: Array<{
    id: number;
    projectId: number;
    name: string;
    worktreePath: string | null;
    worktreeBranch: string | null;
    isDefault: boolean;
    createdAt: string;
  }>;
  sessions?: ProjectSession[];
  cursorSessions?: ProjectSession[];
  codexSessions?: ProjectSession[];
  geminiSessions?: ProjectSession[];
  sessionMeta?: ProjectSessionMeta;
  taskmaster?: ProjectTaskmasterInfo;
  /** Absolute path to this repo's main .git directory.
   *  All worktrees of the same repository share the same value.
   *  Used by the sidebar to group worktrees into multi-stream rows (design brief §3). */
  gitCommonDir?: string | null;
  /** Current git branch name for this project's working directory.
   *  Used as the branch chip label in StreamRow subtitle. */
  gitBranch?: string | null;
  [key: string]: unknown;
}

export interface LoadingProgress {
  type?: 'loading_progress';
  phase?: string;
  current: number;
  total: number;
  currentProject?: string;
  [key: string]: unknown;
}

export interface ProjectsUpdatedMessage {
  type: 'projects_updated';
  projects: Project[];
  changedFile?: string;
  [key: string]: unknown;
}

export interface LoadingProgressMessage extends LoadingProgress {
  type: 'loading_progress';
}

export interface SessionStateChangedMessage {
  type: 'session_state_changed';
  sessionId: string;
  status: SessionStatus;
  provider: SessionProvider;
}

export interface ProjectCreatedMessage {
  type: 'project_created';
  project: {
    id: number;
    name: string;
    directoryPath: string;
  };
}

export interface ProjectDeletedMessage {
  type: 'project_deleted';
  projectId: number;
}

export type AppSocketMessage =
  | LoadingProgressMessage
  | ProjectsUpdatedMessage
  | SessionStateChangedMessage
  | ProjectCreatedMessage
  | ProjectDeletedMessage
  | { type?: string; [key: string]: unknown };
