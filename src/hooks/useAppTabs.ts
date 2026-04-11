import { useEffect, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useHomePreferences } from './useHomePreferences';
import type { AppShellTab, Project, ProjectSession } from '../types/app';

type RootViewMode = 'landing' | 'empty';

type UseAppTabsArgs = {
  selectedProject: Project | null;
  selectedSession: ProjectSession | null;
  sessionId?: string;
  navigate: NavigateFunction;
  onRequestClearSession: () => void;
};

const HOME_TAB_ID = 'home';

const toPreferenceTab = (
  tab: AppShellTab,
  existing?: {
    createdAt: string;
    updatedAt: string;
  },
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

export function useAppTabs({
  selectedProject,
  selectedSession,
  sessionId,
  navigate,
  onRequestClearSession,
}: UseAppTabsArgs) {
  const { preferences, setShellTabs, setActiveShellTabId } = useHomePreferences();
  const [rootViewMode, setRootViewMode] = useState<RootViewMode>('landing');

  const shellTabs = useMemo<AppShellTab[]>(() => {
    return preferences.shellTabs.map((tab) => ({
      id: tab.id,
      kind: tab.kind,
      label: tab.label,
      sessionId: tab.sessionId,
      projectName: tab.projectName,
    }));
  }, [preferences.shellTabs]);

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    const sessionTab = createSessionTab(selectedSession, selectedProject);
    const activeIndex = shellTabs.findIndex((tab) => tab.id === preferences.activeShellTabId);
    const existingIndex = shellTabs.findIndex((tab) => tab.id === sessionTab.id);
    const existingPreferenceTab = preferences.shellTabs.find((tab) => tab.id === sessionTab.id);

    if (existingIndex >= 0) {
      const existingShellTab = shellTabs[existingIndex];
      const tabChanged =
        existingShellTab?.label !== sessionTab.label ||
        existingShellTab?.projectName !== sessionTab.projectName ||
        existingShellTab?.sessionId !== sessionTab.sessionId;

      if (tabChanged) {
        const nextTabs = shellTabs.map((tab) => (tab.id === sessionTab.id ? sessionTab : tab));
        setShellTabs(
          nextTabs.map((tab) =>
            toPreferenceTab(
              tab,
              preferences.shellTabs.find((preferenceTab) => preferenceTab.id === tab.id),
            ),
          ),
        );
      }

      if (preferences.activeShellTabId !== sessionTab.id) {
        setActiveShellTabId(sessionTab.id);
      }

      return;
    }

    const nextTabs = [...shellTabs];
    nextTabs.splice(activeIndex >= 0 ? activeIndex + 1 : nextTabs.length, 0, sessionTab);
    setShellTabs(
      nextTabs.map((tab) =>
        toPreferenceTab(
          tab,
          tab.id === sessionTab.id
            ? existingPreferenceTab
            : preferences.shellTabs.find((preferenceTab) => preferenceTab.id === tab.id),
        ),
      ),
    );
    setActiveShellTabId(sessionTab.id);
  }, [preferences.activeShellTabId, selectedProject, selectedSession, setActiveShellTabId, setShellTabs, shellTabs]);

  useEffect(() => {
    if (sessionId) {
      setActiveShellTabId(`session:${sessionId}`);
    }
  }, [sessionId, setActiveShellTabId]);

  const selectShellTab = (tabId: string) => {
    const tab = shellTabs.find((entry) => entry.id === tabId);
    if (!tab) {
      return;
    }

    setActiveShellTabId(tab.id);

    if (tab.kind === 'home') {
      setRootViewMode('landing');
      onRequestClearSession();
      navigate('/');
      return;
    }

    if (tab.sessionId) {
      navigate(`/session/${tab.sessionId}`);
    }
  };

  const closeShellTab = (tabId: string) => {
    if (tabId === HOME_TAB_ID) {
      return;
    }

    const index = shellTabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) {
      return;
    }

    const nextTabs = shellTabs.filter((tab) => tab.id !== tabId);
    setShellTabs(
      nextTabs.map((tab) =>
        toPreferenceTab(
          tab,
          preferences.shellTabs.find((preferenceTab) => preferenceTab.id === tab.id),
        ),
      ),
    );

    if (preferences.activeShellTabId !== tabId) {
      return;
    }

    const fallback = nextTabs[index] || nextTabs[index - 1];
    if (fallback?.kind === 'session' && fallback.sessionId) {
      setActiveShellTabId(fallback.id);
      navigate(`/session/${fallback.sessionId}`);
      return;
    }

    setActiveShellTabId(HOME_TAB_ID);
    setRootViewMode('empty');
    onRequestClearSession();
    navigate('/');
  };

  const activateHomeTab = () => {
    setRootViewMode('landing');
    selectShellTab(HOME_TAB_ID);
  };

  return {
    shellTabs,
    activeShellTabId: preferences.activeShellTabId,
    rootViewMode,
    setRootViewMode,
    selectShellTab,
    closeShellTab,
    activateHomeTab,
  };
}