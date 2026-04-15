import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { AppShellTab, Project, ProjectSession } from '../types/app';
import type { HomePreferences, RootViewMode, StartupBehavior } from '../types/home';
import { useHomePreferences } from './useHomePreferences';

type UseAppTabsArgs = {
  projects: Project[];
  selectedProject: Project | null;
  selectedSession: ProjectSession | null;
  sessionId?: string;
  startupBehavior: StartupBehavior;
  lastOpenedSessionId: string | null;
  navigate: NavigateFunction;
  onRequestClearSession: () => void;
};

type SessionCatalogEntry = {
  project: Project;
  session: ProjectSession;
};

const toPreferenceTab = (
  tab: AppShellTab,
  existing?: {
    createdAt: string;
    updatedAt: string;
  }
) => ({
  ...tab,
  paneId: null,
  activeContentTab: 'chat' as const,
  createdAt: existing?.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createSessionTab = (session: ProjectSession, project: Project | null): AppShellTab => ({
  id: `session:${session.id}`,
  kind: 'session',
  label: String(session.summary || session.name || session.title || 'Untitled Session'),
  sessionId: session.id,
  projectName: project?.name || session.__projectName || null,
});

const getProjectSessions = (project: Project): ProjectSession[] => [
  ...(project.sessions ?? []),
  ...(project.codexSessions ?? []),
  ...(project.cursorSessions ?? []),
  ...(project.geminiSessions ?? []),
];

const serializePreferenceTabs = (tabs: HomePreferences['shellTabs']) =>
  JSON.stringify(
    tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      sessionId: tab.sessionId,
      projectName: tab.projectName,
      createdAt: tab.createdAt,
      updatedAt: tab.updatedAt,
    }))
  );

export function useAppTabs({
  projects,
  selectedProject,
  selectedSession,
  sessionId,
  startupBehavior,
  lastOpenedSessionId,
  navigate,
  onRequestClearSession,
}: UseAppTabsArgs) {
  const { preferences, setShellTabs, setActiveShellTabId } = useHomePreferences();
  const [rootViewMode, setRootViewMode] = useState<RootViewMode>('landing');

  const sessionCatalog = useMemo(() => {
    const catalog = new Map<string, SessionCatalogEntry>();

    for (const project of projects) {
      for (const session of getProjectSessions(project)) {
        catalog.set(session.id, { project, session });
      }
    }

    return catalog;
  }, [projects]);

  const normalizedPreferenceTabs = useMemo<HomePreferences['shellTabs']>(() => {
    const seenTabIds = new Set<string>();
    const seenSessionIds = new Set<string>();

    return preferences.shellTabs
      .filter((tab) => Boolean(tab.sessionId && sessionCatalog.has(tab.sessionId)))
      .filter((tab) => {
        if (!tab.sessionId || seenTabIds.has(tab.id) || seenSessionIds.has(tab.sessionId)) {
          return false;
        }

        seenTabIds.add(tab.id);
        seenSessionIds.add(tab.sessionId);
        return true;
      })
      .map((tab) => {
        const context = sessionCatalog.get(tab.sessionId!);
        const nextShellTab = createSessionTab(context!.session, context!.project);

        return toPreferenceTab(nextShellTab, tab);
      });
  }, [preferences.shellTabs, sessionCatalog]);

  const shellTabs = useMemo<AppShellTab[]>(() => {
    return normalizedPreferenceTabs.map((tab) => ({
      id: tab.id,
      kind: tab.kind,
      label: tab.label,
      sessionId: tab.sessionId,
      projectName: tab.projectName,
    }));
  }, [normalizedPreferenceTabs]);

  const startupRestoreSessionId = useMemo(() => {
    if (startupBehavior === 'landing') {
      return null;
    }

    if (startupBehavior === 'restore-last') {
      return lastOpenedSessionId && sessionCatalog.has(lastOpenedSessionId)
        ? lastOpenedSessionId
        : null;
    }

    const activeTab = normalizedPreferenceTabs.find((tab) => tab.id === preferences.activeShellTabId);
    if (activeTab?.sessionId) {
      return activeTab.sessionId;
    }

    if (normalizedPreferenceTabs[0]?.sessionId) {
      return normalizedPreferenceTabs[0].sessionId;
    }

    return lastOpenedSessionId && sessionCatalog.has(lastOpenedSessionId)
      ? lastOpenedSessionId
      : null;
  }, [
    lastOpenedSessionId,
    normalizedPreferenceTabs,
    preferences.activeShellTabId,
    sessionCatalog,
    startupBehavior,
  ]);

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }

    const normalizedActiveTabId = normalizedPreferenceTabs.some(
      (tab) => tab.id === preferences.activeShellTabId
    )
      ? preferences.activeShellTabId
      : '';

    if (serializePreferenceTabs(normalizedPreferenceTabs) !== serializePreferenceTabs(preferences.shellTabs)) {
      setShellTabs(normalizedPreferenceTabs);
    }

    if (normalizedActiveTabId !== preferences.activeShellTabId) {
      setActiveShellTabId(normalizedActiveTabId);
    }
  }, [
    normalizedPreferenceTabs,
    preferences.activeShellTabId,
    preferences.shellTabs,
    projects.length,
    setActiveShellTabId,
    setShellTabs,
  ]);

  // Refs to hold latest snapshot for effects that must not re-run on every tab update.
  const shellTabsRef = useRef(shellTabs);
  shellTabsRef.current = shellTabs;
  const activeShellTabIdRef = useRef(preferences.activeShellTabId);
  activeShellTabIdRef.current = preferences.activeShellTabId;
  const prefShellTabsRef = useRef(normalizedPreferenceTabs);
  prefShellTabsRef.current = normalizedPreferenceTabs;

  useEffect(() => {
    if (sessionId) {
      setRootViewMode('empty');
    }
  }, [sessionId]);

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    setRootViewMode('empty');

    const currentShellTabs = shellTabsRef.current;
    const activeTabId = activeShellTabIdRef.current;
    const prefShellTabs = prefShellTabsRef.current;

    const sessionTab = createSessionTab(selectedSession, selectedProject);
    const activeIndex = currentShellTabs.findIndex((tab) => tab.id === activeTabId);
    const existingIndex = currentShellTabs.findIndex((tab) => tab.id === sessionTab.id);
    const existingPreferenceTab = prefShellTabs.find((tab) => tab.id === sessionTab.id);

    if (existingIndex >= 0) {
      const existingShellTab = currentShellTabs[existingIndex];
      const tabChanged =
        existingShellTab?.label !== sessionTab.label ||
        existingShellTab?.projectName !== sessionTab.projectName ||
        existingShellTab?.sessionId !== sessionTab.sessionId;

      if (tabChanged) {
        const nextTabs = currentShellTabs.map((tab) =>
          tab.id === sessionTab.id ? sessionTab : tab
        );
        setShellTabs(
          nextTabs.map((tab) =>
            toPreferenceTab(
              tab,
              prefShellTabs.find((preferenceTab) => preferenceTab.id === tab.id)
            )
          )
        );
      }

      if (activeTabId !== sessionTab.id) {
        setActiveShellTabId(sessionTab.id);
      }

      return;
    }

    const nextTabs = [...currentShellTabs];
    nextTabs.splice(activeIndex >= 0 ? activeIndex + 1 : nextTabs.length, 0, sessionTab);
    setShellTabs(
      nextTabs.map((tab) =>
        toPreferenceTab(
          tab,
          tab.id === sessionTab.id
            ? existingPreferenceTab
            : prefShellTabs.find((preferenceTab) => preferenceTab.id === tab.id)
        )
      )
    );
    setActiveShellTabId(sessionTab.id);
  }, [selectedProject, selectedSession, setActiveShellTabId, setShellTabs]);

  useEffect(() => {
    if (sessionId) {
      setActiveShellTabId(`session:${sessionId}`);
    }
  }, [sessionId, setActiveShellTabId]);

  const openLandingView = useCallback(() => {
    setRootViewMode('landing');
    setActiveShellTabId('');
    onRequestClearSession();
  }, [onRequestClearSession, setActiveShellTabId]);

  const openEmptyShell = useCallback(() => {
    setRootViewMode('empty');
  }, []);

  const selectShellTab = (tabId: string) => {
    const tab = shellTabs.find((entry) => entry.id === tabId);
    if (!tab) {
      return;
    }

    setRootViewMode('empty');
    setActiveShellTabId(tab.id);

    if (tab.sessionId) {
      navigate(`/session/${tab.sessionId}`);
    }
  };

  const closeShellTab = (tabId: string) => {
    const index = shellTabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) {
      return;
    }

    const nextTabs = shellTabs.filter((tab) => tab.id !== tabId);
    setShellTabs(
      nextTabs.map((tab) =>
        toPreferenceTab(
          tab,
          preferences.shellTabs.find((preferenceTab) => preferenceTab.id === tab.id)
        )
      )
    );

    if (preferences.activeShellTabId !== tabId) {
      return;
    }

    const fallback = nextTabs[index] || nextTabs[index - 1];
    if (fallback?.kind === 'session' && fallback.sessionId) {
      setRootViewMode('empty');
      setActiveShellTabId(fallback.id);
      navigate(`/session/${fallback.sessionId}`);
      return;
    }

    openLandingView();
    navigate('/');
  };

  return {
    shellTabs,
    activeShellTabId: preferences.activeShellTabId,
    rootViewMode,
    setRootViewMode,
    startupRestoreSessionId,
    openLandingView,
    openEmptyShell,
    selectShellTab,
    closeShellTab,
  };
}
