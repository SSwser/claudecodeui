import { useEffect, useMemo, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { AppShellTab, Project, ProjectSession } from '../types/app';
import { useHomePreferences } from './useHomePreferences';

type RootViewMode = 'landing' | 'empty';

type UseAppTabsArgs = {
  selectedProject: Project | null;
  selectedSession: ProjectSession | null;
  sessionId?: string;
  navigate: NavigateFunction;
  onRequestClearSession: () => void;
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

  // Refs to hold latest snapshot for effects that must not re-run on every tab update.
  const shellTabsRef = useRef(shellTabs);
  shellTabsRef.current = shellTabs;
  const activeShellTabIdRef = useRef(preferences.activeShellTabId);
  activeShellTabIdRef.current = preferences.activeShellTabId;
  const prefShellTabsRef = useRef(preferences.shellTabs);
  prefShellTabsRef.current = preferences.shellTabs;

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

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

  const selectShellTab = (tabId: string) => {
    const tab = shellTabs.find((entry) => entry.id === tabId);
    if (!tab) {
      return;
    }

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
      setActiveShellTabId(fallback.id);
      navigate(`/session/${fallback.sessionId}`);
      return;
    }

    setActiveShellTabId('');
    setRootViewMode('empty');
    onRequestClearSession();
    navigate('/');
  };

  return {
    shellTabs,
    activeShellTabId: preferences.activeShellTabId,
    rootViewMode,
    setRootViewMode,
    selectShellTab,
    closeShellTab,
  };
}
