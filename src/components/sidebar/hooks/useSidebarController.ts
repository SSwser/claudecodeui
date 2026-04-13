import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import type {
  DeleteProjectConfirmation,
  SidebarProjectGroup,
  SidebarProjectListItem,
  SidebarRecentSession,
} from '../types/types';
import {
  getAllSessions,
  getProjectLastActivity,
  getSessionDate,
  getSessionName,
} from '../utils/utils';
import { useHomePreferences } from '@/hooks/useHomePreferences';
import type { Project, ProjectSession } from '@/types/app';
import { formatTimeAgo } from '@/utils/dateUtils';
import { api } from '@/utils/api';

type SnippetHighlight = {
  start: number;
  end: number;
};

type ConversationMatch = {
  role: string;
  snippet: string;
  highlights: SnippetHighlight[];
  timestamp: string | null;
  provider?: string;
  messageUuid?: string | null;
};

type ConversationSession = {
  sessionId: string;
  sessionSummary: string;
  provider?: string;
  matches: ConversationMatch[];
};

type ConversationProjectResult = {
  projectName: string;
  projectDisplayName: string;
  sessions: ConversationSession[];
};

export type ConversationSearchResults = {
  results: ConversationProjectResult[];
  totalMatches: number;
  query: string;
};

export type SearchProgress = {
  scannedProjects: number;
  totalProjects: number;
};

type UseSidebarControllerArgs = {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  isMobile: boolean;
  t: TFunction;
  onRefresh: () => Promise<void> | void;
  onProjectSelect: (project: Project) => void;
  onOpenSession: (session: ProjectSession) => void;
  onProjectDelete?: (projectName: string) => void;
  setCurrentProject: (project: Project) => void;
  setSidebarVisible: (visible: boolean) => void;
  sidebarVisible: boolean;
};

const EMPTY_ADDITIONAL_SESSIONS = {};
const ACTIVE_SESSION_WINDOW_MS = 10 * 60 * 1000;

const splitPathSegments = (pathValue?: string): string[] => {
  if (!pathValue) {
    return [];
  }

  return pathValue.replace(/\\/g, '/').split('/').filter(Boolean);
};

const getWorkspaceLabel = (project: Project): string => {
  const segments = splitPathSegments(project.fullPath || project.path);
  return segments[segments.length - 1] || project.displayName || project.name;
};

const isMultiWorkspaceEnabled = (project: Project | null): boolean => {
  if (!project) {
    return false;
  }

  return Boolean(
    (project as { multi_workspace_enabled?: boolean }).multi_workspace_enabled ??
    (project as { multiWorkspaceEnabled?: boolean }).multiWorkspaceEnabled
  );
};

const resolveActivityTimestamp = (session: ProjectSession): string => {
  const candidates = [
    session.lastActivity,
    session.updated_at,
    session.createdAt,
    session.created_at,
  ];
  const value = candidates.find(
    (candidate) => typeof candidate === 'string' && candidate.length > 0
  );
  return value || new Date(0).toISOString();
};

const matchesSearch = (values: Array<string | undefined>, searchValue: string): boolean => {
  if (!searchValue) {
    return true;
  }

  return values.some((value) => (value || '').toLowerCase().includes(searchValue));
};

/**
 * Normalize a file-system path to forward slashes for comparison.
 */
const normalizePath = (p: string): string => p.replace(/\\/g, '/');

/**
 * Group flat project list items into multi-stream groups (design brief §3).
 *
 * Uses `project.gitCommonDir` (populated server-side via `git rev-parse
 * --git-common-dir`) to reliably detect worktrees regardless of directory
 * naming conventions.  Projects that share the same gitCommonDir are all
 * worktrees of the same repo.
 *
 * Fallback: if gitCommonDir is unavailable (non-git project or old server),
 * each project becomes a standalone single-stream group.
 *
 * "Main" heuristic: pick the project whose fullPath equals or is the direct
 * parent of the gitCommonDir (.git lives at root of main checkout), otherwise
 * fall back to the project with the shortest fullPath.
 */
function groupProjectsIntoStreams(items: SidebarProjectListItem[]): SidebarProjectGroup[] {
  // Bucket projects by normalized gitCommonDir
  const byCommonDir = new Map<string, SidebarProjectListItem[]>();
  const standalone: SidebarProjectListItem[] = [];

  for (const item of items) {
    const raw = item.project.gitCommonDir;
    if (!raw) {
      standalone.push(item);
      continue;
    }
    const key = normalizePath(raw);
    const bucket = byCommonDir.get(key) ?? [];
    bucket.push(item);
    byCommonDir.set(key, bucket);
  }

  const groups: SidebarProjectGroup[] = [];

  for (const bucket of byCommonDir.values()) {
    if (bucket.length === 1) {
      groups.push({ main: bucket[0], children: [] });
      continue;
    }

    // Identify the "main" project: the one whose fullPath is the direct parent
    // of the .git directory (i.e. gitCommonDir starts with fullPath + '/.git').
    // Falls back to shortest path so the repo root sorts to the top.
    const sorted = [...bucket].sort((a, b) => {
      const aPath = normalizePath(a.project.fullPath);
      const bPath = normalizePath(b.project.fullPath);
      const commonDir = normalizePath(a.project.gitCommonDir ?? '');
      const aIsMain = commonDir.startsWith(aPath + '/') || commonDir === aPath;
      const bIsMain = commonDir.startsWith(bPath + '/') || commonDir === bPath;
      if (aIsMain !== bIsMain) return aIsMain ? -1 : 1;
      return aPath.length - bPath.length;
    });

    groups.push({ main: sorted[0], children: sorted.slice(1) });
  }

  // Append standalone (non-git / missing gitCommonDir) projects as single-stream
  for (const item of standalone) {
    groups.push({ main: item, children: [] });
  }

  return groups;
}

export function useSidebarController({
  projects,
  selectedProject,
  isLoading,
  isMobile,
  t,
  onRefresh,
  onProjectSelect,
  onOpenSession,
  onProjectDelete,
  setCurrentProject,
  setSidebarVisible,
  sidebarVisible,
}: UseSidebarControllerArgs) {
  const { preferences, markFavoriteAccessed } = useHomePreferences();
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteProjectConfirmation | null>(
    null
  );
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [searchMode, setSearchMode] = useState<'projects' | 'conversations'>('projects');
  const [conversationResults, setConversationResults] = useState<ConversationSearchResults | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeqRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const projectSelectDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSidebarCollapsed = !isMobile && !sidebarVisible;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Debounced conversation search with SSE streaming
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const query = searchFilter.trim();
    if (searchMode !== 'conversations' || query.length < 2) {
      searchSeqRef.current += 1;
      setConversationResults(null);
      setSearchProgress(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const seq = ++searchSeqRef.current;

    searchTimeoutRef.current = setTimeout(() => {
      if (seq !== searchSeqRef.current) return;

      const url = api.searchConversationsUrl(query);
      const es = new EventSource(url);
      eventSourceRef.current = es;

      const accumulated: ConversationProjectResult[] = [];
      let totalMatches = 0;

      es.addEventListener('result', (evt) => {
        if (seq !== searchSeqRef.current) {
          es.close();
          return;
        }
        try {
          const data = JSON.parse(evt.data) as {
            projectResult: ConversationProjectResult;
            totalMatches: number;
            scannedProjects: number;
            totalProjects: number;
          };
          accumulated.push(data.projectResult);
          totalMatches = data.totalMatches;
          setConversationResults({ results: [...accumulated], totalMatches, query });
          setSearchProgress({
            scannedProjects: data.scannedProjects,
            totalProjects: data.totalProjects,
          });
        } catch {
          // Ignore malformed SSE data
        }
      });

      es.addEventListener('progress', (evt) => {
        if (seq !== searchSeqRef.current) {
          es.close();
          return;
        }
        try {
          const data = JSON.parse(evt.data) as {
            totalMatches: number;
            scannedProjects: number;
            totalProjects: number;
          };
          totalMatches = data.totalMatches;
          setSearchProgress({
            scannedProjects: data.scannedProjects,
            totalProjects: data.totalProjects,
          });
        } catch {
          // Ignore malformed SSE data
        }
      });

      es.addEventListener('done', () => {
        if (seq !== searchSeqRef.current) {
          es.close();
          return;
        }
        es.close();
        eventSourceRef.current = null;
        setIsSearching(false);
        setSearchProgress(null);
        if (accumulated.length === 0) {
          setConversationResults({ results: [], totalMatches: 0, query });
        }
      });

      es.addEventListener('error', () => {
        if (seq !== searchSeqRef.current) {
          es.close();
          return;
        }
        es.close();
        eventSourceRef.current = null;
        setIsSearching(false);
        setSearchProgress(null);
        if (accumulated.length === 0) {
          setConversationResults({ results: [], totalMatches: 0, query });
        }
      });
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (projectSelectDebounceRef.current) {
        clearTimeout(projectSelectDebounceRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [searchFilter, searchMode]);

  const favoriteSessionIds = useMemo(
    () =>
      new Set(
        preferences.favorites
          .filter((favorite) => favorite.kind === 'session')
          .map((favorite) => favorite.sessionId)
      ),
    [preferences.favorites]
  );

  const normalizedSearch = searchFilter.trim().toLowerCase();

  const sidebarProjects = useMemo<SidebarProjectListItem[]>(() => {
    return projects
      .map((project) => {
        const sessions = getAllSessions(project, EMPTY_ADDITIONAL_SESSIONS);
        const latestActivity = getProjectLastActivity(project, EMPTY_ADDITIONAL_SESSIONS);
        const hasActiveSessions = sessions.some(
          (session) =>
            currentTime.getTime() - getSessionDate(session).getTime() < ACTIVE_SESSION_WINDOW_MS
        );

        return {
          project,
          displayName: project.displayName || project.name,
          workspaceName: getWorkspaceLabel(project),
          branch: project.gitBranch ?? undefined,
          hasActiveSessions,
          // TODO: compute from session data once the session model exposes a
          // "waiting for user input" flag. Until then this is always false to
          // avoid misleading the user with incorrect status dots.
          hasWaitingSessions: false,
          latestActivity,
        };
      })
      .filter((projectItem) =>
        matchesSearch(
          [projectItem.displayName, projectItem.project.name, projectItem.workspaceName],
          normalizedSearch
        )
      )
      .sort((left, right) => {
        const activityDiff = right.latestActivity.getTime() - left.latestActivity.getTime();
        if (activityDiff !== 0) {
          return activityDiff;
        }

        return left.displayName.localeCompare(right.displayName);
      })
      .map(({ latestActivity: _latestActivity, ...projectItem }) => projectItem);
  }, [currentTime, normalizedSearch, projects]);

  /** Multi-stream groups — design brief §3 (Adaptive C2 Pattern). */
  const groupedProjects = useMemo<SidebarProjectGroup[]>(
    () => groupProjectsIntoStreams(sidebarProjects),
    [sidebarProjects]
  );

  // Expansion state is now fully derived from the URL (selectedProject).
  // Clicking the +N badge or the divider header navigates to the main project
  // via onProjectSelect, so no local expansion state is needed.

  const recentSessions = useMemo<SidebarRecentSession[]>(() => {
    return projects
      .flatMap((project) => {
        const workspaceName = getWorkspaceLabel(project);

        return getAllSessions(project, EMPTY_ADDITIONAL_SESSIONS).map((session) => ({
          project,
          session,
          title: getSessionName(session, t),
          displayProjectName: project.displayName || project.name,
          workspaceName: isMultiWorkspaceEnabled(project) ? workspaceName : undefined,
          summary: typeof session.summary === 'string' ? session.summary : undefined,
          lastActivityLabel: formatTimeAgo(resolveActivityTimestamp(session), currentTime, t),
          isFavorite: favoriteSessionIds.has(session.id),
          lastActivity: getSessionDate(session),
        }));
      })
      .filter((recentSession) =>
        matchesSearch(
          [
            recentSession.title,
            recentSession.displayProjectName,
            recentSession.project.name,
            recentSession.workspaceName,
            recentSession.summary,
          ],
          normalizedSearch
        )
      )
      .sort((left, right) => {
        if (left.isFavorite !== right.isFavorite) {
          return left.isFavorite ? -1 : 1;
        }

        return right.lastActivity.getTime() - left.lastActivity.getTime();
      })
      .slice(0, 10)
      .map(({ lastActivity: _lastActivity, ...recentSession }) => recentSession);
  }, [currentTime, favoriteSessionIds, normalizedSearch, projects, t]);

  const activeWorkspaceName = useMemo(() => {
    if (!isMultiWorkspaceEnabled(selectedProject)) {
      return null;
    }

    return selectedProject ? getWorkspaceLabel(selectedProject) : null;
  }, [selectedProject]);

  const startEditing = useCallback((project: Project) => {
    setEditingProject(project.name);
    setEditingName(project.displayName);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingProject(null);
    setEditingName('');
  }, []);

  const saveProjectName = useCallback(
    async (projectName: string) => {
      try {
        const response = await api.renameProject(projectName, editingName);
        if (response.ok) {
          if (window.refreshProjects) {
            await window.refreshProjects();
          } else {
            window.location.reload();
          }
        } else {
          console.error('Failed to rename project');
        }
      } catch (error) {
        console.error('Error renaming project:', error);
      } finally {
        setEditingProject(null);
        setEditingName('');
      }
    },
    [editingName]
  );

  const requestProjectDelete = useCallback((project: Project) => {
    setDeleteConfirmation({
      project,
      sessionCount: getAllSessions(project, EMPTY_ADDITIONAL_SESSIONS).length,
    });
  }, []);

  const confirmDeleteProject = useCallback(async () => {
    if (!deleteConfirmation) {
      return;
    }

    const { project, sessionCount } = deleteConfirmation;
    const isEmpty = sessionCount === 0;

    setDeleteConfirmation(null);
    setDeletingProjects((prev) => new Set([...prev, project.name]));

    try {
      const response = await api.deleteProject(project.name, !isEmpty);

      if (response.ok) {
        onProjectDelete?.(project.name);
      } else {
        const error = (await response.json()) as { error?: string };
        alert(error.error || t('messages.deleteProjectFailed'));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(t('messages.deleteProjectError'));
    } finally {
      setDeletingProjects((prev) => {
        const next = new Set(prev);
        next.delete(project.name);
        return next;
      });
    }
  }, [deleteConfirmation, onProjectDelete, t]);

  const handleProjectSelect = useCallback(
    (project: Project) => {
      // Update local sidebar state immediately for responsive visual feedback,
      // but debounce the actual navigation to prevent thrashing when the user
      // clicks rapidly through several projects.
      setCurrentProject(project);
      if (projectSelectDebounceRef.current) {
        clearTimeout(projectSelectDebounceRef.current);
      }
      projectSelectDebounceRef.current = setTimeout(() => {
        onProjectSelect(project);
        projectSelectDebounceRef.current = null;
      }, 150);
    },
    [onProjectSelect, setCurrentProject]
  );

  const openSessionFromSidebar = useCallback(
    (session: ProjectSession, project: Project | null = null) => {
      const projectName = project?.name || session.__projectName;
      const sessionToOpen = projectName ? { ...session, __projectName: projectName } : session;

      if (project) {
        // Opening a recent session should land on the session route directly.
        // Debounced project navigation is useful for browsing the project list, but it would
        // race with session routing here and can bounce users back to the inbox.
        setCurrentProject(project);
        if (projectSelectDebounceRef.current) {
          clearTimeout(projectSelectDebounceRef.current);
          projectSelectDebounceRef.current = null;
        }
      }

      if (favoriteSessionIds.has(session.id)) {
        markFavoriteAccessed(`session:${session.id}`);
      }

      onOpenSession(sessionToOpen);
    },
    [favoriteSessionIds, markFavoriteAccessed, onOpenSession, setCurrentProject]
  );

  const refreshProjects = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const collapseSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, [setSidebarVisible]);

  const expandSidebar = useCallback(() => {
    setSidebarVisible(true);
  }, [setSidebarVisible]);

  const clearConversationResults = useCallback(() => {
    searchSeqRef.current += 1;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsSearching(false);
    setSearchProgress(null);
    setConversationResults(null);
  }, []);

  return {
    isSidebarCollapsed,
    editingProject,
    showNewProject,
    editingName,
    isRefreshing,
    searchFilter,
    deletingProjects,
    deleteConfirmation,
    showVersionModal,
    sidebarProjects,
    groupedProjects,
    recentSessions,
    activeWorkspaceName,
    startEditing,
    cancelEditing,
    saveProjectName,
    requestProjectDelete,
    confirmDeleteProject,
    handleProjectSelect,
    openSessionFromSidebar,
    refreshProjects,
    collapseSidebar,
    expandSidebar,
    setShowNewProject,
    setEditingName,
    searchMode,
    setSearchMode,
    conversationResults,
    isSearching,
    searchProgress,
    clearConversationResults,
    setSearchFilter,
    setDeleteConfirmation,
    setShowVersionModal,
  };
}
