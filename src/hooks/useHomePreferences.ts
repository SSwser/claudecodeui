import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { AppTab } from '../types/app';
import type {
  FavoriteSessionEntry,
  FavoriteWorkspaceEntry,
  HomeFavoriteEntry,
  HomeFilters,
  HomeLayoutMode,
  HomePaneId,
  HomePreferences,
  HomeShellTabKind,
  LayoutPreferences,
  PaneDescriptor,
  StartupBehavior,
} from '../types/home';

export const HOME_PREFERENCES_STORAGE_KEY = 'chorus:home-preferences';
export const HOME_PREFERENCES_SYNC_EVENT = 'chorus:home-preferences-sync';

const MAX_WORKSPACE_FAVORITES = 20;
const MAX_SESSION_FAVORITES = 20;
const STARTUP_BEHAVIORS: StartupBehavior[] = ['restore-all', 'restore-last', 'landing'];
const LAYOUT_MODES: HomeLayoutMode[] = ['single', 'dual'];
const PANE_IDS: HomePaneId[] = ['primary', 'secondary'];

type SetStateAction = {
  type: 'set_state';
  value: HomePreferences;
};

type PatchAction = {
  type: 'patch';
  value: Partial<HomePreferences>;
};

type HomePreferencesAction = SetStateAction | PatchAction;

type SyncEventDetail = {
  storageKey: string;
  sourceId: string;
  value: HomePreferences;
};

type ToggleWorkspaceFavoriteInput = Omit<
  FavoriteWorkspaceEntry,
  'id' | 'kind' | 'favoritedAt' | 'lastAccessedAt'
>;
type ToggleSessionFavoriteInput = Omit<
  FavoriteSessionEntry,
  'id' | 'kind' | 'favoritedAt' | 'lastAccessedAt'
>;

const nowIso = () => new Date().toISOString();

const createDefaultPanes = (): PaneDescriptor[] => [
  { paneId: 'primary', sessionId: null, projectName: null, tabId: null, activeContentTab: 'chat' },
  {
    paneId: 'secondary',
    sessionId: null,
    projectName: null,
    tabId: null,
    activeContentTab: 'chat',
  },
];

const createDefaultLayout = (): LayoutPreferences => ({
  mode: 'single',
  activePane: 'primary',
  panes: createDefaultPanes(),
  updatedAt: nowIso(),
});

const DEFAULT_FILTERS: HomeFilters = {
  search: '',
  project: null,
  workspace: null,
  sessionType: 'all',
};

export const DEFAULT_HOME_PREFERENCES: HomePreferences = {
  version: 2,
  // Default to 'landing' so the app opens fresh rather than restoring the last
  // session automatically — users who want restore behaviour can change this in Settings.
  startupBehavior: 'landing',
  favorites: [],
  filters: DEFAULT_FILTERS,
  layout: createDefaultLayout(),
  shellTabs: [],
  activeShellTabId: '',
  lastOpenedProjectName: null,
  lastOpenedSessionId: null,
  lastOpenedAt: null,
};

const arePreferencesEqual = (left: HomePreferences, right: HomePreferences) =>
  JSON.stringify(left) === JSON.stringify(right);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isValidStartupBehavior = (value: unknown): value is StartupBehavior =>
  typeof value === 'string' && STARTUP_BEHAVIORS.includes(value as StartupBehavior);

const isValidLayoutMode = (value: unknown): value is HomeLayoutMode =>
  typeof value === 'string' && LAYOUT_MODES.includes(value as HomeLayoutMode);

const isValidAppTab = (value: unknown): value is AppTab =>
  value === 'chat' ||
  value === 'files' ||
  value === 'shell' ||
  value === 'git' ||
  value === 'tasks' ||
  value === 'preview' ||
  (typeof value === 'string' && value.startsWith('plugin:'));

const normalizeTimestamp = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const normalizeText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

const normalizePane = (value: unknown, fallback: PaneDescriptor): PaneDescriptor => {
  if (!isRecord(value)) {
    return fallback;
  }

  const paneId = PANE_IDS.includes(value.paneId as HomePaneId)
    ? (value.paneId as HomePaneId)
    : fallback.paneId;

  return {
    paneId,
    sessionId: typeof value.sessionId === 'string' && value.sessionId ? value.sessionId : null,
    projectName:
      typeof value.projectName === 'string' && value.projectName ? value.projectName : null,
    tabId: typeof value.tabId === 'string' && value.tabId ? value.tabId : null,
    activeContentTab: isValidAppTab(value.activeContentTab) ? value.activeContentTab : 'chat',
  };
};

const clampFavorites = (favorites: HomeFavoriteEntry[]): HomeFavoriteEntry[] => {
  const workspaceFavorites: HomeFavoriteEntry[] = [];
  const sessionFavorites: HomeFavoriteEntry[] = [];

  for (const favorite of favorites) {
    if (favorite.kind === 'workspace') {
      if (workspaceFavorites.length < MAX_WORKSPACE_FAVORITES) {
        workspaceFavorites.push(favorite);
      }
      continue;
    }

    if (sessionFavorites.length < MAX_SESSION_FAVORITES) {
      sessionFavorites.push(favorite);
    }
  }

  return [...workspaceFavorites, ...sessionFavorites];
};

const normalizeWorkspaceFavorite = (
  value: Record<string, unknown>,
  fallbackTime: string
): FavoriteWorkspaceEntry | null => {
  const projectName = normalizeText(value.projectName);
  if (!projectName) {
    return null;
  }

  const displayName = normalizeText(value.displayName, projectName);
  const favoritedAt = normalizeTimestamp(value.favoritedAt, fallbackTime);
  const lastAccessedAt = normalizeTimestamp(value.lastAccessedAt, favoritedAt);

  return {
    id: `workspace:${projectName}`,
    kind: 'workspace',
    projectName,
    displayName,
    path: normalizeText(value.path) || undefined,
    favoritedAt,
    lastAccessedAt,
  };
};

const normalizeSessionFavorite = (
  value: Record<string, unknown>,
  fallbackTime: string
): FavoriteSessionEntry | null => {
  const sessionId = normalizeText(value.sessionId);
  const projectName = normalizeText(value.projectName);
  const title = normalizeText(value.title, normalizeText(value.summary, 'Untitled Session'));

  if (!sessionId || !projectName) {
    return null;
  }

  const provider = ['claude', 'cursor', 'codex', 'gemini'].includes(String(value.provider))
    ? (value.provider as FavoriteSessionEntry['provider'])
    : 'claude';
  const status = ['active', 'paused', 'archived', 'idle'].includes(String(value.status))
    ? (value.status as FavoriteSessionEntry['status'])
    : 'idle';
  const favoritedAt = normalizeTimestamp(value.favoritedAt, fallbackTime);
  const lastAccessedAt = normalizeTimestamp(value.lastAccessedAt, favoritedAt);

  return {
    id: `session:${sessionId}`,
    kind: 'session',
    sessionId,
    projectName,
    workspaceName: normalizeText(value.workspaceName) || undefined,
    title,
    provider,
    status,
    summary: normalizeText(value.summary) || undefined,
    favoritedAt,
    lastAccessedAt,
  };
};

const normalizeFavorites = (value: unknown): HomeFavoriteEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const fallbackTime = nowIso();
  const favorites = value
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      if (entry.kind === 'workspace') {
        return normalizeWorkspaceFavorite(entry, fallbackTime);
      }

      if (entry.kind === 'session') {
        return normalizeSessionFavorite(entry, fallbackTime);
      }

      return null;
    })
    .filter((entry): entry is HomeFavoriteEntry => Boolean(entry));

  return clampFavorites(favorites);
};

const normalizeFilters = (value: unknown): HomeFilters => {
  if (!isRecord(value)) {
    return DEFAULT_FILTERS;
  }

  return {
    search: normalizeText(value.search),
    project: normalizeText(value.project) || null,
    workspace: normalizeText(value.workspace) || null,
    sessionType: ['all', 'claude', 'cursor', 'codex', 'gemini'].includes(String(value.sessionType))
      ? (value.sessionType as HomeFilters['sessionType'])
      : 'all',
  };
};

const normalizeLayout = (value: unknown): LayoutPreferences => {
  if (!isRecord(value)) {
    return createDefaultLayout();
  }

  const defaultLayout = createDefaultLayout();
  const rawPanes = Array.isArray(value.panes) ? value.panes : [];
  const panes = defaultLayout.panes.map((pane, index) => normalizePane(rawPanes[index], pane));

  return {
    mode: isValidLayoutMode(value.mode) ? value.mode : defaultLayout.mode,
    activePane: PANE_IDS.includes(value.activePane as HomePaneId)
      ? (value.activePane as HomePaneId)
      : defaultLayout.activePane,
    panes,
    updatedAt: normalizeTimestamp(value.updatedAt, defaultLayout.updatedAt),
  };
};

const normalizeShellTabs = (value: unknown): HomePreferences['shellTabs'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenTabIds = new Set<string>();
  const seenSessionIds = new Set<string>();

  const normalized: HomePreferences['shellTabs'] = value
    .filter((entry): entry is Record<string, unknown> => isRecord(entry))
    .filter((entry) => entry.kind === 'session')
    .map<HomePreferences['shellTabs'][number]>((entry) => {
      const kind: HomeShellTabKind = 'session';
      const paneId: HomePaneId | null =
        entry.paneId === 'primary' || entry.paneId === 'secondary' ? entry.paneId : null;

      return {
        id: normalizeText(entry.id) || `tab-${Math.random().toString(36).slice(2)}`,
        kind,
        label: normalizeText(entry.label, 'Session'),
        projectName: normalizeText(entry.projectName) || null,
        sessionId: normalizeText(entry.sessionId) || null,
        paneId,
        activeContentTab: 'chat',
        createdAt: normalizeTimestamp(entry.createdAt, nowIso()),
        updatedAt: normalizeTimestamp(entry.updatedAt, nowIso()),
      };
    })
    .filter((entry) => Boolean(entry.sessionId))
    .filter((entry) => {
      if (seenTabIds.has(entry.id) || seenSessionIds.has(entry.sessionId!)) {
        return false;
      }

      seenTabIds.add(entry.id);
      seenSessionIds.add(entry.sessionId!);
      return true;
    });

  return normalized;
};

const normalizeHomePreferences = (value: unknown): HomePreferences => {
  if (!isRecord(value)) {
    return DEFAULT_HOME_PREFERENCES;
  }

  const shellTabs = normalizeShellTabs(value.shellTabs);
  const normalizedActiveShellTabId = normalizeText(value.activeShellTabId);

  // v1 → v2 migration: the default startup behaviour changed from 'restore-all' to
  // 'landing'.  Reset any stored 'restore-all' that was written while it was the
  // product default, so existing users get the new "open fresh" experience.  Users
  // who explicitly want restore-all can re-enable it in Settings.
  const storedStartupBehavior = isValidStartupBehavior(value.startupBehavior)
    ? value.startupBehavior
    : DEFAULT_HOME_PREFERENCES.startupBehavior;
  const migratedStartupBehavior: StartupBehavior =
    value.version === 1 && storedStartupBehavior === 'restore-all'
      ? 'landing'
      : storedStartupBehavior;

  return {
    version: 2,
    startupBehavior: migratedStartupBehavior,
    favorites: normalizeFavorites(value.favorites),
    filters: normalizeFilters(value.filters),
    layout: normalizeLayout(value.layout),
    shellTabs,
    activeShellTabId: shellTabs.some((tab) => tab.id === normalizedActiveShellTabId)
      ? normalizedActiveShellTabId
      : '',
    lastOpenedProjectName: normalizeText(value.lastOpenedProjectName) || null,
    lastOpenedSessionId: normalizeText(value.lastOpenedSessionId) || null,
    lastOpenedAt:
      typeof value.lastOpenedAt === 'string'
        ? normalizeTimestamp(value.lastOpenedAt, nowIso())
        : null,
  };
};

const migrateLegacyStarredProjects = (): FavoriteWorkspaceEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem('starredProjects');
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const fallbackTime = nowIso();
    return parsed
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .slice(0, MAX_WORKSPACE_FAVORITES)
      .map((projectName) => ({
        id: `workspace:${projectName}`,
        kind: 'workspace',
        projectName,
        displayName: projectName,
        favoritedAt: fallbackTime,
        lastAccessedAt: fallbackTime,
      }));
  } catch {
    return [];
  }
};

export const readHomePreferencesSnapshot = (
  storageKey = HOME_PREFERENCES_STORAGE_KEY
): HomePreferences => {
  if (typeof window === 'undefined') {
    return DEFAULT_HOME_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const normalized = normalizeHomePreferences(parsed);
      if (normalized.favorites.length > 0 || !localStorage.getItem('starredProjects')) {
        return normalized;
      }
    }
  } catch {
    // Ignore malformed payloads and fall back to a safe default.
  }

  return {
    ...DEFAULT_HOME_PREFERENCES,
    favorites: migrateLegacyStarredProjects(),
  };
};

export const writeHomePreferencesSnapshot = (
  nextPreferences: HomePreferences,
  options: { storageKey?: string; sourceId?: string } = {}
) => {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = options.storageKey || HOME_PREFERENCES_STORAGE_KEY;
  const normalized = normalizeHomePreferences(nextPreferences);
  localStorage.setItem(storageKey, JSON.stringify(normalized));

  window.dispatchEvent(
    new CustomEvent<SyncEventDetail>(HOME_PREFERENCES_SYNC_EVENT, {
      detail: {
        storageKey,
        sourceId: options.sourceId || 'external',
        value: normalized,
      },
    })
  );
};

function reducer(state: HomePreferences, action: HomePreferencesAction): HomePreferences {
  switch (action.type) {
    case 'set_state': {
      return arePreferencesEqual(state, action.value) ? state : action.value;
    }
    case 'patch': {
      const nextState = normalizeHomePreferences({
        ...state,
        ...action.value,
      });
      return arePreferencesEqual(state, nextState) ? state : nextState;
    }
    default:
      return state;
  }
}

export function useHomePreferences(storageKey = HOME_PREFERENCES_STORAGE_KEY) {
  const instanceIdRef = useRef(`home-preferences-${Math.random().toString(36).slice(2)}`);
  const suppressNextWriteRef = useRef(false);
  const [preferences, dispatch] = useReducer(reducer, storageKey, readHomePreferencesSnapshot);

  useEffect(() => {
    if (suppressNextWriteRef.current) {
      suppressNextWriteRef.current = false;
      return;
    }

    writeHomePreferencesSnapshot(preferences, {
      storageKey,
      sourceId: instanceIdRef.current,
    });
  }, [preferences, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const apply = (value: unknown) => {
      suppressNextWriteRef.current = true;
      dispatch({ type: 'set_state', value: normalizeHomePreferences(value) });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || event.newValue === null) {
        return;
      }

      try {
        apply(JSON.parse(event.newValue));
      } catch {
        apply(DEFAULT_HOME_PREFERENCES);
      }
    };

    const handleSync = (event: Event) => {
      const syncEvent = event as CustomEvent<SyncEventDetail>;
      const detail = syncEvent.detail;
      if (
        !detail ||
        detail.storageKey !== storageKey ||
        detail.sourceId === instanceIdRef.current
      ) {
        return;
      }

      apply(detail.value);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(HOME_PREFERENCES_SYNC_EVENT, handleSync as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(HOME_PREFERENCES_SYNC_EVENT, handleSync as EventListener);
    };
  }, [storageKey]);

  const setStartupBehavior = useCallback((startupBehavior: StartupBehavior) => {
    dispatch({ type: 'patch', value: { startupBehavior } });
  }, []);

  const setFilters = useCallback(
    (filters: Partial<HomeFilters>) => {
      dispatch({
        type: 'patch',
        value: {
          filters: normalizeFilters({
            ...preferences.filters,
            ...filters,
          }),
        },
      });
    },
    [preferences.filters]
  );

  const setLayout = useCallback(
    (layout: Partial<LayoutPreferences>) => {
      dispatch({
        type: 'patch',
        value: {
          layout: normalizeLayout({
            ...preferences.layout,
            ...layout,
            updatedAt: nowIso(),
          }),
        },
      });
    },
    [preferences.layout]
  );

  const setLayoutMode = useCallback(
    (mode: HomeLayoutMode) => {
      setLayout({ mode });
    },
    [setLayout]
  );

  const setShellTabs = useCallback((shellTabs: HomePreferences['shellTabs']) => {
    dispatch({ type: 'patch', value: { shellTabs } });
  }, []);

  const setActiveShellTabId = useCallback((activeShellTabId: string) => {
    dispatch({ type: 'patch', value: { activeShellTabId } });
  }, []);

  const setActivePane = useCallback(
    (activePane: HomePaneId) => {
      setLayout({ activePane });
    },
    [setLayout]
  );

  const assignSessionToPane = useCallback(
    (
      paneId: HomePaneId,
      payload: {
        sessionId: string | null;
        projectName?: string | null;
        tabId?: string | null;
        activeContentTab?: PaneDescriptor['activeContentTab'];
      }
    ) => {
      const panes = preferences.layout.panes.map((pane) =>
        pane.paneId === paneId
          ? {
              ...pane,
              sessionId: payload.sessionId,
              projectName: payload.projectName ?? null,
              tabId: payload.tabId ?? null,
              activeContentTab:
                payload.activeContentTab ?? (payload.sessionId ? pane.activeContentTab : 'chat'),
            }
          : pane
      );

      setLayout({ panes, activePane: paneId });
    },
    [preferences.layout.panes, setLayout]
  );

  const setPaneContentTab = useCallback(
    (paneId: HomePaneId, activeContentTab: PaneDescriptor['activeContentTab']) => {
      const panes = preferences.layout.panes.map((pane) =>
        pane.paneId === paneId
          ? {
              ...pane,
              activeContentTab,
            }
          : pane
      );

      setLayout({ panes, activePane: paneId });
    },
    [preferences.layout.panes, setLayout]
  );

  const recordOpenContext = useCallback(
    (projectName: string | null, sessionId: string | null) => {
      if (
        preferences.lastOpenedProjectName === projectName &&
        preferences.lastOpenedSessionId === sessionId
      ) {
        return;
      }

      dispatch({
        type: 'patch',
        value: {
          lastOpenedProjectName: projectName,
          lastOpenedSessionId: sessionId,
          lastOpenedAt: nowIso(),
        },
      });
    },
    [preferences.lastOpenedProjectName, preferences.lastOpenedSessionId]
  );

  const toggleWorkspaceFavorite = useCallback(
    (workspace: ToggleWorkspaceFavoriteInput) => {
      const id = `workspace:${workspace.projectName}`;
      const existing = preferences.favorites.find((favorite) => favorite.id === id);

      if (existing) {
        dispatch({
          type: 'patch',
          value: {
            favorites: preferences.favorites.filter((favorite) => favorite.id !== id),
          },
        });
        return false;
      }

      const timestamp = nowIso();
      const nextFavorite: FavoriteWorkspaceEntry = {
        id,
        kind: 'workspace',
        projectName: workspace.projectName,
        displayName: workspace.displayName,
        path: workspace.path,
        favoritedAt: timestamp,
        lastAccessedAt: timestamp,
      };

      dispatch({
        type: 'patch',
        value: {
          favorites: clampFavorites([
            nextFavorite,
            ...preferences.favorites.filter((favorite) => favorite.id !== id),
          ]),
        },
      });
      return true;
    },
    [preferences.favorites]
  );

  const toggleSessionFavorite = useCallback(
    (session: ToggleSessionFavoriteInput) => {
      const id = `session:${session.sessionId}`;
      const existing = preferences.favorites.find((favorite) => favorite.id === id);

      if (existing) {
        dispatch({
          type: 'patch',
          value: {
            favorites: preferences.favorites.filter((favorite) => favorite.id !== id),
          },
        });
        return false;
      }

      const timestamp = nowIso();
      const nextFavorite: FavoriteSessionEntry = {
        id,
        kind: 'session',
        sessionId: session.sessionId,
        projectName: session.projectName,
        workspaceName: session.workspaceName,
        title: session.title,
        provider: session.provider,
        status: session.status,
        summary: session.summary,
        favoritedAt: timestamp,
        lastAccessedAt: timestamp,
      };

      dispatch({
        type: 'patch',
        value: {
          favorites: clampFavorites([
            nextFavorite,
            ...preferences.favorites.filter((favorite) => favorite.id !== id),
          ]),
        },
      });
      return true;
    },
    [preferences.favorites]
  );

  const markFavoriteAccessed = useCallback(
    (favoriteId: string) => {
      dispatch({
        type: 'patch',
        value: {
          favorites: preferences.favorites.map((favorite) =>
            favorite.id === favoriteId ? { ...favorite, lastAccessedAt: nowIso() } : favorite
          ),
        },
      });
    },
    [preferences.favorites]
  );

  const resetHomePreferences = useCallback(() => {
    dispatch({ type: 'set_state', value: DEFAULT_HOME_PREFERENCES });
  }, []);

  const api = useMemo(() => {
    return {
      setStartupBehavior,
      setFilters,
      setLayout,
      setLayoutMode,
      setShellTabs,
      setActiveShellTabId,
      setActivePane,
      assignSessionToPane,
      setPaneContentTab,
      recordOpenContext,
      toggleWorkspaceFavorite,
      toggleSessionFavorite,
      markFavoriteAccessed,
      resetHomePreferences,
    };
  }, [
    assignSessionToPane,
    markFavoriteAccessed,
    recordOpenContext,
    resetHomePreferences,
    setActivePane,
    setActiveShellTabId,
    setFilters,
    setLayout,
    setLayoutMode,
    setPaneContentTab,
    setShellTabs,
    setStartupBehavior,
    toggleSessionFavorite,
    toggleWorkspaceFavorite,
  ]);

  return {
    preferences,
    ...api,
  };
}
