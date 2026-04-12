import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { api } from '../utils/api';
import { useHomePreferences } from './useHomePreferences';
import type {
  AppSocketMessage,
  AppTab,
  LoadingProgress,
  Project,
  ProjectSession,
  ProjectsUpdatedMessage,
} from '../types/app';
import type { LandingPageData } from '../components/main-content/types/types';

type UseProjectsStateArgs = {
  sessionId?: string;
  navigate: NavigateFunction;
  latestMessage: AppSocketMessage | null;
  isMobile: boolean;
  activeSessions: Set<string>;
};

type FetchProjectsOptions = {
  showLoadingState?: boolean;
};

const isDbBackedProject = (
  project: Record<string, unknown>,
): project is Record<string, unknown> & { directoryPath: string } => {
  return typeof project.directoryPath === 'string';
};

const normalizeProjectRecord = (project: Project): Project => {
  if (!isDbBackedProject(project as Record<string, unknown>)) {
    return {
      ...project,
      displayName: project.displayName || project.name,
      fullPath: project.fullPath || project.path || '',
      path: project.path || project.fullPath || '',
      directoryPath: project.directoryPath || project.fullPath || project.path || '',
    };
  }

  const directoryPath = project.directoryPath || project.fullPath || project.path || '';
  const displayName =
    typeof project.displayName === 'string' && project.displayName.trim()
      ? project.displayName
      : project.name;

  return {
    ...project,
    displayName,
    fullPath: project.fullPath || directoryPath,
    path: project.path || directoryPath,
    directoryPath,
    multiWorkspaceEnabled: Boolean(project.multiWorkspaceEnabled),
    sessions: project.sessions ?? [],
    codexSessions: project.codexSessions ?? [],
    cursorSessions: project.cursorSessions ?? [],
    geminiSessions: project.geminiSessions ?? [],
  };
};

const serialize = (value: unknown) => JSON.stringify(value ?? null);

const projectsHaveChanges = (
  prevProjects: Project[],
  nextProjects: Project[],
  includeExternalSessions: boolean,
): boolean => {
  if (prevProjects.length !== nextProjects.length) {
    return true;
  }

  return nextProjects.some((nextProject, index) => {
    const prevProject = prevProjects[index];
    if (!prevProject) {
      return true;
    }

    const baseChanged =
      nextProject.name !== prevProject.name ||
      nextProject.displayName !== prevProject.displayName ||
      nextProject.fullPath !== prevProject.fullPath ||
      serialize(nextProject.sessionMeta) !== serialize(prevProject.sessionMeta) ||
      serialize(nextProject.sessions) !== serialize(prevProject.sessions) ||
      serialize(nextProject.taskmaster) !== serialize(prevProject.taskmaster);

    if (baseChanged) {
      return true;
    }

    if (!includeExternalSessions) {
      return false;
    }

    return (
      serialize(nextProject.cursorSessions) !== serialize(prevProject.cursorSessions) ||
      serialize(nextProject.codexSessions) !== serialize(prevProject.codexSessions) ||
      serialize(nextProject.geminiSessions) !== serialize(prevProject.geminiSessions)
    );
  });
};

const getProjectSessions = (project: Project): ProjectSession[] => {
  return [
    ...(project.sessions ?? []),
    ...(project.codexSessions ?? []),
    ...(project.cursorSessions ?? []),
    ...(project.geminiSessions ?? []),
  ];
};

const getSessionDisplayName = (session: ProjectSession): string =>
  String(session.summary || session.name || session.title || 'Untitled Session');

const getSessionActivityDate = (session: ProjectSession): Date => {
  const candidates = [session.lastActivity, session.updated_at, session.createdAt, session.created_at];
  const first = candidates.find((value) => typeof value === 'string' && value.length > 0);
  const parsed = first ? new Date(first) : new Date(0);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const splitPathSegments = (pathValue?: string): string[] => {
  if (!pathValue) {
    return [];
  }

  return pathValue
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);
};

const getWorkspaceLabel = (project: Project): string => {
  const segments = splitPathSegments(project.fullPath || project.path);
  return segments[segments.length - 1] || project.displayName || project.name;
};

const getProjectGroupLabel = (project: Project): string => {
  const segments = splitPathSegments(project.fullPath || project.path);
  if (segments.length >= 2) {
    return segments[segments.length - 2];
  }

  return project.displayName || project.name;
};

const formatRelativeActivity = (date: Date): string => {
  if (!date || Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return 'Unknown activity';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const isUpdateAdditive = (
  currentProjects: Project[],
  updatedProjects: Project[],
  selectedProject: Project | null,
  selectedSession: ProjectSession | null,
): boolean => {
  if (!selectedProject || !selectedSession) {
    return true;
  }

  const currentSelectedProject = currentProjects.find((project) => project.name === selectedProject.name);
  const updatedSelectedProject = updatedProjects.find((project) => project.name === selectedProject.name);

  if (!currentSelectedProject || !updatedSelectedProject) {
    return false;
  }

  const currentSelectedSession = getProjectSessions(currentSelectedProject).find(
    (session) => session.id === selectedSession.id,
  );
  const updatedSelectedSession = getProjectSessions(updatedSelectedProject).find(
    (session) => session.id === selectedSession.id,
  );

  if (!currentSelectedSession || !updatedSelectedSession) {
    return false;
  }

  return (
    currentSelectedSession.id === updatedSelectedSession.id &&
    currentSelectedSession.title === updatedSelectedSession.title &&
    currentSelectedSession.created_at === updatedSelectedSession.created_at &&
    currentSelectedSession.updated_at === updatedSelectedSession.updated_at
  );
};

const VALID_TABS: Set<string> = new Set(['chat', 'files', 'shell', 'git', 'tasks', 'preview']);

const isValidTab = (tab: string): tab is AppTab => {
  return VALID_TABS.has(tab) || tab.startsWith('plugin:');
};

const readPersistedTab = (): AppTab => {
  try {
    const stored = localStorage.getItem('activeTab');
    if (stored && isValidTab(stored)) {
      return stored as AppTab;
    }
  } catch {
    // localStorage unavailable
  }
  return 'chat';
};

export function useProjectsState({
  sessionId,
  navigate,
  latestMessage,
  isMobile,
  activeSessions,
}: UseProjectsStateArgs) {
  const {
    preferences: homePreferences,
    setFilters: setHomeFilters,
    toggleWorkspaceFavorite,
    toggleSessionFavorite,
    recordOpenContext,
  } = useHomePreferences();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSession, setSelectedSession] = useState<ProjectSession | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(readPersistedTab);

  useEffect(() => {
    try {
      localStorage.setItem('activeTab', activeTab);
    } catch {
      // Silently ignore storage errors
    }
  }, [activeTab]);

  useEffect(() => {
    recordOpenContext(selectedProject?.name || null, selectedSession?.id || null);
  }, [recordOpenContext, selectedProject?.name, selectedSession?.id]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('agents');
  const [externalMessageUpdate, setExternalMessageUpdate] = useState(0);

  const loadingProgressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProjects = useCallback(async ({ showLoadingState = true }: FetchProjectsOptions = {}) => {
    try {
      if (showLoadingState) {
        setIsLoadingProjects(true);
      }
      const response = await api.projects();
      const projectData = ((await response.json()) as Project[]).map(normalizeProjectRecord);

      setProjects((prevProjects) => {
        if (prevProjects.length === 0) {
          return projectData;
        }

        return projectsHaveChanges(prevProjects, projectData, true)
          ? projectData
          : prevProjects;
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      if (showLoadingState) {
        setIsLoadingProjects(false);
      }
    }
  }, []);

  const refreshProjectsSilently = useCallback(async () => {
    // Keep chat view stable while still syncing sidebar/session metadata in background.
    await fetchProjects({ showLoadingState: false });
  }, [fetchProjects]);

  const openSettings = useCallback((tab = 'tools') => {
    setSettingsInitialTab(tab);
    setShowSettings(true);
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  // Auto-select the project when there is only one, so the user lands on the new session page
  useEffect(() => {
    if (!isLoadingProjects && projects.length === 1 && !selectedProject && !sessionId) {
      setSelectedProject(projects[0]);
    }
  }, [isLoadingProjects, projects, selectedProject, sessionId]);

  useEffect(() => {
    if (!latestMessage) {
      return;
    }

    if (latestMessage.type === 'loading_progress') {
      if (loadingProgressTimeoutRef.current) {
        clearTimeout(loadingProgressTimeoutRef.current);
        loadingProgressTimeoutRef.current = null;
      }

      setLoadingProgress(latestMessage as LoadingProgress);

      if (latestMessage.phase === 'complete') {
        loadingProgressTimeoutRef.current = setTimeout(() => {
          setLoadingProgress(null);
          loadingProgressTimeoutRef.current = null;
        }, 500);
      }

      return;
    }

    if (latestMessage.type !== 'projects_updated') {
      return;
    }

    const projectsMessage = latestMessage as ProjectsUpdatedMessage;

    if (projectsMessage.changedFile && selectedSession && selectedProject) {
      const normalized = projectsMessage.changedFile.replace(/\\/g, '/');
      const changedFileParts = normalized.split('/');

      if (changedFileParts.length >= 2) {
        const filename = changedFileParts[changedFileParts.length - 1];
        const changedSessionId = filename.replace('.jsonl', '');

        if (changedSessionId === selectedSession.id) {
          const isSessionActive = activeSessions.has(selectedSession.id);

          if (!isSessionActive) {
            setExternalMessageUpdate((prev) => prev + 1);
          }
        }
      }
    }

    const hasActiveSession =
      (selectedSession && activeSessions.has(selectedSession.id)) ||
      (activeSessions.size > 0 && Array.from(activeSessions).some((id) => id.startsWith('new-session-')));

    const updatedProjects = projectsMessage.projects;

    if (
      hasActiveSession &&
      !isUpdateAdditive(projects, updatedProjects, selectedProject, selectedSession)
    ) {
      return;
    }

    setProjects(updatedProjects);

    if (!selectedProject) {
      return;
    }

    const updatedSelectedProject = updatedProjects.find(
      (project) => project.name === selectedProject.name,
    );

    if (!updatedSelectedProject) {
      return;
    }

    if (serialize(updatedSelectedProject) !== serialize(selectedProject)) {
      setSelectedProject(updatedSelectedProject);
    }

    if (!selectedSession) {
      return;
    }

    const updatedSelectedSession = getProjectSessions(updatedSelectedProject).find(
      (session) => session.id === selectedSession.id,
    );

    if (!updatedSelectedSession) {
      setSelectedSession(null);
    }
  }, [latestMessage, selectedProject, selectedSession, activeSessions, projects]);

  useEffect(() => {
    return () => {
      if (loadingProgressTimeoutRef.current) {
        clearTimeout(loadingProgressTimeoutRef.current);
        loadingProgressTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionId || projects.length === 0) {
      return;
    }

    for (const project of projects) {
      const claudeSession = project.sessions?.find((session) => session.id === sessionId);
      if (claudeSession) {
        const shouldUpdateProject = selectedProject?.name !== project.name;
        const shouldUpdateSession =
          selectedSession?.id !== sessionId || selectedSession.__provider !== 'claude';

        if (shouldUpdateProject) {
          setSelectedProject(project);
        }
        if (shouldUpdateSession) {
          setSelectedSession({ ...claudeSession, __provider: 'claude' });
        }
        return;
      }

      const cursorSession = project.cursorSessions?.find((session) => session.id === sessionId);
      if (cursorSession) {
        const shouldUpdateProject = selectedProject?.name !== project.name;
        const shouldUpdateSession =
          selectedSession?.id !== sessionId || selectedSession.__provider !== 'cursor';

        if (shouldUpdateProject) {
          setSelectedProject(project);
        }
        if (shouldUpdateSession) {
          setSelectedSession({ ...cursorSession, __provider: 'cursor' });
        }
        return;
      }

      const codexSession = project.codexSessions?.find((session) => session.id === sessionId);
      if (codexSession) {
        const shouldUpdateProject = selectedProject?.name !== project.name;
        const shouldUpdateSession =
          selectedSession?.id !== sessionId || selectedSession.__provider !== 'codex';

        if (shouldUpdateProject) {
          setSelectedProject(project);
        }
        if (shouldUpdateSession) {
          setSelectedSession({ ...codexSession, __provider: 'codex' });
        }
        return;
      }

      const geminiSession = project.geminiSessions?.find((session) => session.id === sessionId);
      if (geminiSession) {
        const shouldUpdateProject = selectedProject?.name !== project.name;
        const shouldUpdateSession =
          selectedSession?.id !== sessionId || selectedSession.__provider !== 'gemini';

        if (shouldUpdateProject) {
          setSelectedProject(project);
        }
        if (shouldUpdateSession) {
          setSelectedSession({ ...geminiSession, __provider: 'gemini' });
        }
        return;
      }
    }
  }, [sessionId, projects, selectedProject?.name, selectedSession?.id, selectedSession?.__provider]);

  const handleProjectSelect = useCallback(
    (project: Project) => {
      setSelectedProject(project);
      setSelectedSession(null);
      setActiveTab('chat');
      navigate('/');

      if (isMobile) {
        setSidebarOpen(false);
      }
    },
    [isMobile, navigate],
  );

  const handleSessionSelect = useCallback(
    (session: ProjectSession) => {
      setSelectedSession(session);

      if (activeTab === 'tasks' || activeTab === 'preview') {
        setActiveTab('chat');
      }

      const provider = localStorage.getItem('selected-provider') || 'claude';
      if (provider === 'cursor') {
        sessionStorage.setItem('cursorSessionId', session.id);
      }

      if (isMobile) {
        const sessionProjectName = session.__projectName;
        const currentProjectName = selectedProject?.name;

        if (sessionProjectName !== currentProjectName) {
          setSidebarOpen(false);
        }
      }

      navigate(`/session/${session.id}`);
    },
    [activeTab, isMobile, navigate, selectedProject?.name],
  );

  const handleNewSession = useCallback(
    (project: Project) => {
      setSelectedProject(project);
      setSelectedSession(null);
      setActiveTab('chat');
      navigate('/');

      if (isMobile) {
        setSidebarOpen(false);
      }
    },
    [isMobile, navigate],
  );

  const handleSessionDelete = useCallback(
    (sessionIdToDelete: string) => {
      if (selectedSession?.id === sessionIdToDelete) {
        setSelectedSession(null);
        navigate('/');
      }

      setProjects((prevProjects) =>
        prevProjects.map((project) => ({
          ...project,
          sessions: project.sessions?.filter((session) => session.id !== sessionIdToDelete) ?? [],
          sessionMeta: {
            ...project.sessionMeta,
            total: Math.max(0, (project.sessionMeta?.total as number | undefined ?? 0) - 1),
          },
        })),
      );
    },
    [navigate, selectedSession?.id],
  );

  const handleSidebarRefresh = useCallback(async () => {
    try {
      const response = await api.projects();
      const freshProjects = (await response.json()) as Project[];

      setProjects((prevProjects) =>
        projectsHaveChanges(prevProjects, freshProjects, true) ? freshProjects : prevProjects,
      );

      if (!selectedProject) {
        return;
      }

      const refreshedProject = freshProjects.find((project) => project.name === selectedProject.name);
      if (!refreshedProject) {
        return;
      }

      if (serialize(refreshedProject) !== serialize(selectedProject)) {
        setSelectedProject(refreshedProject);
      }

      if (!selectedSession) {
        return;
      }

      const refreshedSession = getProjectSessions(refreshedProject).find(
        (session) => session.id === selectedSession.id,
      );

      if (refreshedSession) {
        // Keep provider metadata stable when refreshed payload doesn't include __provider.
        const normalizedRefreshedSession =
          refreshedSession.__provider || !selectedSession.__provider
            ? refreshedSession
            : { ...refreshedSession, __provider: selectedSession.__provider };

        if (serialize(normalizedRefreshedSession) !== serialize(selectedSession)) {
          setSelectedSession(normalizedRefreshedSession);
        }
      }
    } catch (error) {
      console.error('Error refreshing sidebar:', error);
    }
  }, [selectedProject, selectedSession]);

  const handleProjectDelete = useCallback(
    (projectName: string) => {
      if (selectedProject?.name === projectName) {
        setSelectedProject(null);
        setSelectedSession(null);
        navigate('/');
      }

      setProjects((prevProjects) => prevProjects.filter((project) => project.name !== projectName));
    },
    [navigate, selectedProject?.name],
  );

  const clearSelectedSessionSelection = useCallback(() => {
    setSelectedSession(null);
  }, []);

  const sidebarSharedProps = useMemo(
    () => ({
      projects,
      selectedProject,
      onProjectSelect: handleProjectSelect,
      onOpenSession: handleSessionSelect,
      onProjectDelete: handleProjectDelete,
      isLoading: isLoadingProjects,
      loadingProgress,
      onRefresh: handleSidebarRefresh,
      onShowSettings: () => setShowSettings(true),
      showSettings,
      settingsInitialTab,
      onCloseSettings: () => setShowSettings(false),
      isMobile,
    }),
    [
      handleProjectDelete,
      handleProjectSelect,
      handleSessionSelect,
      handleSidebarRefresh,
      isLoadingProjects,
      isMobile,
      loadingProgress,
      projects,
      settingsInitialTab,
      selectedProject,
      showSettings,
    ],
  );

  const allHomeSessions = useMemo(() => {
    return projects.flatMap((project) =>
      getProjectSessions(project).map((session) => {
        const activityDate = getSessionActivityDate(session);
        const isActive = activeSessions.has(session.id) || Date.now() - activityDate.getTime() < 10 * 60 * 1000;
        const projectGroup = getProjectGroupLabel(project);
        const workspaceLabel = getWorkspaceLabel(project);

        return {
          id: `home-session:${session.id}`,
          sessionId: session.id,
          title: getSessionDisplayName(session),
          projectName: project.name,
          projectGroup,
          workspaceName: workspaceLabel,
          displayProjectName: project.displayName || project.name,
          provider: session.__provider || 'claude',
          status: isActive ? 'active' : 'idle',
          summary: typeof session.summary === 'string' ? session.summary : undefined,
          lastActivityDate: activityDate,
          lastActivityLabel: formatRelativeActivity(activityDate),
        };
      }),
    );
  }, [activeSessions, projects]);

  const projectOptions = useMemo(
    () => {
      const groups = Array.from(new Set(projects.map((project) => getProjectGroupLabel(project)))).sort((left, right) =>
        left.localeCompare(right),
      );

      return [{ value: 'all', label: 'All projects' }, ...groups.map((group) => ({ value: group, label: group }))];
    },
    [projects],
  );

  const workspaceOptions = useMemo(() => {
    const matchingProjects = homePreferences.filters.project
      ? projects.filter((project) => getProjectGroupLabel(project) === homePreferences.filters.project)
      : projects;

    return [
      { value: 'all', label: 'All workspaces' },
      ...matchingProjects
        .map((project) => ({ value: project.name, label: getWorkspaceLabel(project) }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    ];
  }, [homePreferences.filters.project, projects]);

  const favoriteWorkspaceSet = useMemo(
    () => new Set(homePreferences.favorites.filter((favorite) => favorite.kind === 'workspace').map((favorite) => favorite.projectName)),
    [homePreferences.favorites],
  );

  const favoriteSessionSet = useMemo(
    () => new Set(homePreferences.favorites.filter((favorite) => favorite.kind === 'session').map((favorite) => favorite.sessionId)),
    [homePreferences.favorites],
  );

  const favoriteWorkspaces = useMemo(() => {
    return homePreferences.favorites
      .filter((favorite) => favorite.kind === 'workspace')
      .map((favorite) => {
        const project = projects.find((entry) => entry.name === favorite.projectName);
        const sessions = project ? getProjectSessions(project) : [];
        return {
          id: favorite.id,
          projectName: favorite.projectName,
          displayName: project?.displayName || favorite.displayName,
          path: project?.fullPath || favorite.path,
          sessionCount: sessions.length,
        };
      });
  }, [homePreferences.favorites, projects]);

  const favoriteSessions = useMemo(() => {
    return homePreferences.favorites
      .filter((favorite) => favorite.kind === 'session')
      .map((favorite) => {
        const current = allHomeSessions.find((session) => session.sessionId === favorite.sessionId);
        return {
          id: favorite.id,
          sessionId: favorite.sessionId,
          projectName: current?.projectName || favorite.projectName,
          title: current?.title || favorite.title,
          provider: current?.provider || favorite.provider,
          status: current?.status || favorite.status,
          summary: current?.summary || favorite.summary,
        };
      });
  }, [allHomeSessions, homePreferences.favorites]);

  const filteredRecentSessions = useMemo(() => {
    const normalizedSearch = homePreferences.filters.search.trim().toLowerCase();

    return allHomeSessions
      .filter((session) => {
        if (homePreferences.filters.project && session.projectName !== homePreferences.filters.project) {
          if (session.projectGroup !== homePreferences.filters.project) {
            return false;
          }
        }

        if (homePreferences.filters.workspace && session.projectName !== homePreferences.filters.workspace) {
          return false;
        }

        if (homePreferences.filters.sessionType !== 'all' && session.provider !== homePreferences.filters.sessionType) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          session.title,
          session.projectName,
          session.projectGroup,
          session.workspaceName,
          session.displayProjectName,
          session.summary || '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => right.lastActivityDate.getTime() - left.lastActivityDate.getTime())
      .slice(0, 10)
      .map((session) => ({
        ...session,
        isFavorite: favoriteSessionSet.has(session.sessionId),
      }));
  }, [allHomeSessions, favoriteSessionSet, homePreferences.filters]);

  const landingPageData = useMemo<LandingPageData>(
    () => ({
      filters: {
        search: homePreferences.filters.search,
        project: homePreferences.filters.project,
        workspace: homePreferences.filters.workspace,
        sessionType: homePreferences.filters.sessionType,
      },
      favoriteWorkspaces,
      favoriteSessions,
      recentSessions: filteredRecentSessions,
      projectOptions,
      workspaceOptions,
    }),
    [favoriteSessions, favoriteWorkspaces, filteredRecentSessions, homePreferences.filters, projectOptions, workspaceOptions],
  );

  return {
    projects,
    selectedProject,
    selectedSession,
    activeTab,
    sidebarOpen,
    isLoadingProjects,
    loadingProgress,
    isInputFocused,
    showSettings,
    settingsInitialTab,
    externalMessageUpdate,
    setActiveTab,
    setSidebarOpen,
    setIsInputFocused,
    setShowSettings,
    openSettings,
    fetchProjects,
    refreshProjectsSilently,
    startupBehavior: homePreferences.startupBehavior,
    lastOpenedSessionId: homePreferences.lastOpenedSessionId,
    landingPageData,
    setLandingSearch: (value: string) => setHomeFilters({ search: value }),
    setLandingProjectFilter: (value: string | null) => setHomeFilters({ project: value, workspace: null }),
    setLandingWorkspaceFilter: (value: string | null) => setHomeFilters({ workspace: value }),
    setLandingSessionTypeFilter: (value: string) => setHomeFilters({ sessionType: value as typeof homePreferences.filters.sessionType }),
    toggleWorkspaceFavoriteByProjectName: (projectName: string, displayName: string, path?: string) =>
      toggleWorkspaceFavorite({ projectName, displayName, path }),
    toggleSessionFavoriteById: (sessionId: string) => {
      const session = allHomeSessions.find((entry) => entry.sessionId === sessionId);
      if (!session) {
        return false;
      }

      return toggleSessionFavorite({
        sessionId: session.sessionId,
        projectName: session.projectName,
        title: session.title,
        provider: session.provider as 'claude' | 'cursor' | 'codex' | 'gemini',
        status: session.status as 'active' | 'paused' | 'archived' | 'idle',
        summary: session.summary,
      });
    },
    favoriteWorkspaceSet,
    favoriteSessionSet,
    sidebarSharedProps,
    handleProjectSelect,
    handleSessionSelect,
    handleNewSession,
    handleSessionDelete,
    handleProjectDelete,
    handleSidebarRefresh,
    clearSelectedSessionSelection,
  };
}
