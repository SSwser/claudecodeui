import type { AppTab, SessionProvider } from './app';

export type StartupBehavior = 'restore-all' | 'restore-last' | 'landing';

export type HomeLayoutMode = 'single' | 'dual';

export type HomePaneId = 'primary' | 'secondary';

export type HomeFavoriteKind = 'workspace' | 'session';

export type HomeSessionStatus = 'active' | 'paused' | 'archived' | 'idle';

export type HomeFilterSessionType = 'all' | SessionProvider;

export type FavoriteWorkspaceEntry = {
  id: string;
  kind: 'workspace';
  projectName: string;
  displayName: string;
  path?: string;
  favoritedAt: string;
  lastAccessedAt: string;
};

export type FavoriteSessionEntry = {
  id: string;
  kind: 'session';
  sessionId: string;
  projectName: string;
  workspaceName?: string;
  title: string;
  provider: SessionProvider;
  status: HomeSessionStatus;
  summary?: string;
  favoritedAt: string;
  lastAccessedAt: string;
};

export type HomeFavoriteEntry = FavoriteWorkspaceEntry | FavoriteSessionEntry;

export type HomeFilters = {
  search: string;
  project: string | null;
  workspace: string | null;
  sessionType: HomeFilterSessionType;
};

export type HomeShellTabKind = 'home' | 'session';

export type HomeShellTab = {
  id: string;
  kind: HomeShellTabKind;
  label: string;
  projectName: string | null;
  sessionId: string | null;
  paneId: HomePaneId | null;
  activeContentTab: AppTab;
  createdAt: string;
  updatedAt: string;
};

export type PaneDescriptor = {
  paneId: HomePaneId;
  sessionId: string | null;
  projectName: string | null;
  tabId: string | null;
  activeContentTab: AppTab;
};

export type LayoutPreferences = {
  mode: HomeLayoutMode;
  activePane: HomePaneId;
  panes: PaneDescriptor[];
  updatedAt: string;
};

export type HomePreferences = {
  version: 1;
  startupBehavior: StartupBehavior;
  favorites: HomeFavoriteEntry[];
  filters: HomeFilters;
  layout: LayoutPreferences;
  shellTabs: HomeShellTab[];
  activeShellTabId: string;
  lastOpenedProjectName: string | null;
  lastOpenedSessionId: string | null;
  lastOpenedAt: string | null;
};
