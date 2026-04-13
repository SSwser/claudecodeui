import type { Dispatch, SetStateAction } from 'react';
import type { AppTab, Project, ProjectSession } from '../../../types/app';

export type SessionLifecycleHandler = (sessionId?: string | null) => void;

export type TaskMasterTask = {
  id: string | number;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  details?: string;
  testStrategy?: string;
  parentId?: string | number;
  dependencies?: Array<string | number>;
  subtasks?: TaskMasterTask[];
  [key: string]: unknown;
};

export type TaskReference = {
  id: string | number;
  title?: string;
  [key: string]: unknown;
};

export type TaskSelection = TaskMasterTask | TaskReference;

export type PrdFile = {
  name: string;
  content?: string;
  isExisting?: boolean;
  [key: string]: unknown;
};

export type MainContentProps = {
  selectedProject: Project | null;
  selectedSession: ProjectSession | null;
  projects: Project[];
  activeTab: AppTab;
  setActiveTab: Dispatch<SetStateAction<AppTab>>;
  ws: WebSocket | null;
  sendMessage: (message: unknown) => void;
  latestMessage: unknown;
  isMobile: boolean;
  onMenuClick: () => void;
  isLoading: boolean;
  onInputFocusChange: (focused: boolean) => void;
  onSessionActive: SessionLifecycleHandler;
  onSessionInactive: SessionLifecycleHandler;
  onSessionProcessing: SessionLifecycleHandler;
  onSessionNotProcessing: SessionLifecycleHandler;
  processingSessions: Set<string>;
  onReplaceTemporarySession: SessionLifecycleHandler;
  onNavigateToSession: (targetSessionId: string) => void;
  onOpenProjectSession: (session: ProjectSession) => void;
  onCreateProjectSession: (project: Project) => void;
  onShowSettings: () => void;
  externalMessageUpdate: number;
  showLandingPage: boolean;
  forceEmptyState?: boolean;
  landingPageData: LandingPageData;
  onLandingFiltersChange: {
    onSearchChange: (value: string) => void;
    onProjectChange: (value: string | null) => void;
    onWorkspaceChange: (value: string | null) => void;
    onSessionTypeChange: (value: string) => void;
  };
  onLandingActions: {
    onOpenWorkspace: (projectName: string) => void;
    onOpenSession: (sessionId: string) => void;
    onToggleWorkspaceFavorite: (projectName: string, displayName: string, path?: string) => void;
    onToggleSessionFavorite: (sessionId: string) => void;
    onCreateSession: () => void;
    onCreateWorkspace: () => void;
  };
};

export type MainContentHeaderProps = {
  activeTab: AppTab;
  setActiveTab: Dispatch<SetStateAction<AppTab>>;
  selectedProject: Project;
  selectedSession: ProjectSession | null;
  shouldShowTasksTab: boolean;
  isMobile: boolean;
  onMenuClick: () => void;
};

export type MainContentStateViewProps = {
  mode: 'loading' | 'empty' | 'home';
  isMobile: boolean;
  onMenuClick: () => void;
  onCreateProject?: () => void;
  landingPageData?: LandingPageData;
  onLandingFiltersChange?: MainContentProps['onLandingFiltersChange'];
  onLandingActions?: MainContentProps['onLandingActions'];
};

export type MobileMenuButtonProps = {
  onMenuClick: () => void;
  compact?: boolean;
};

export type TaskMasterPanelProps = {
  isVisible: boolean;
};

export type LandingOption = {
  value: string;
  label: string;
};

export type FavoriteWorkspaceSummary = {
  id: string;
  projectName: string;
  displayName: string;
  path?: string;
  sessionCount: number;
};

export type FavoriteSessionSummary = {
  id: string;
  sessionId: string;
  projectName: string;
  title: string;
  provider: string;
  status: string;
  summary?: string;
};

export type RecentSessionSummary = {
  id: string;
  sessionId: string;
  title: string;
  projectName: string;
  displayProjectName: string;
  provider: string;
  status: string;
  lastActivityLabel: string;
  summary?: string;
  isFavorite: boolean;
};

export type LandingPageData = {
  projectCount: number;
  filters: {
    search: string;
    project: string | null;
    workspace: string | null;
    sessionType: string;
  };
  favoriteWorkspaces: FavoriteWorkspaceSummary[];
  favoriteSessions: FavoriteSessionSummary[];
  recentSessions: RecentSessionSummary[];
  projectOptions: LandingOption[];
  workspaceOptions: LandingOption[];
};
