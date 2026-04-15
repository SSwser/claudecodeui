import type { LoadingProgress, Project, ProjectSession, SessionProvider } from '../../../types/app';

export type ProjectSortOrder = 'name' | 'date';

export type SessionWithProvider = ProjectSession & {
  __provider: SessionProvider;
};

export type AdditionalSessionsByProject = Record<string, ProjectSession[]>;
export type LoadingSessionsByProject = Record<string, boolean>;

export type DeleteProjectConfirmation = {
  project: Project;
  sessionCount: number;
};

export type SessionDeleteConfirmation = {
  projectName: string;
  sessionId: string;
  sessionTitle: string;
  provider: SessionProvider;
};

export type SidebarProps = {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onOpenSession: (session: ProjectSession) => void;
  onProjectDelete?: (projectName: string) => void;
  isLoading: boolean;
  loadingProgress: LoadingProgress | null;
  onRefresh: () => Promise<void> | void;
  onShowSettings: () => void;
  showSettings: boolean;
  settingsInitialTab: string;
  onCloseSettings: () => void;
  isMobile: boolean;
};

export type SidebarRecentSession = {
  project: Project;
  session: SessionWithProvider;
  title: string;
  displayProjectName: string;
  workspaceName?: string;
  summary?: string;
  lastActivityLabel: string;
  isFavorite: boolean;
};

export type SidebarProjectListItem = {
  project: Project;
  displayName: string;
  workspaceName: string;
  /** Git branch name for the branch chip in StreamRow subtitle. */
  branch?: string;
  hasActiveSessions: boolean;
  /** True when ≥1 session in this project is waiting for user input.
   *  Drives the red dot (running-waiting) in StreamRow.
   *  Currently always false — session data doesn't expose a waiting-for-input flag yet.
   *  Wire up once the session status model supports it. */
  hasWaitingSessions: boolean;
};

/**
 * Multi-Stream Adaptive C2 Pattern (design brief §3).
 *
 * Groups related projects (same repo, different worktrees/branches) into
 * a single collapsible unit. Single-stream projects have an empty `children` array.
 */
export type SidebarProjectGroup = {
  /** The primary project (repo root / main branch). */
  main: SidebarProjectListItem;
  /** Additional streams (worktrees / branches) under the same repo. */
  children: SidebarProjectListItem[];
};

export type SessionViewModel = {
  isCursorSession: boolean;
  isCodexSession: boolean;
  isGeminiSession: boolean;
  isActive: boolean;
  sessionName: string;
  sessionTime: string;
  messageCount: number;
};

export type MCPServerStatus = {
  hasMCPServer?: boolean;
  isConfigured?: boolean;
} | null;

export type SettingsProject = Pick<Project, 'name' | 'displayName' | 'fullPath' | 'path'>;
