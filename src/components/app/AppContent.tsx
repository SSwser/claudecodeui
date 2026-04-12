import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../sidebar/view/Sidebar';
import MainContent from '../main-content/view/MainContent';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAppTabs } from '../../hooks/useAppTabs';
import { useDeviceSettings } from '../../hooks/useDeviceSettings';
import { useSessionProtection } from '../../hooks/useSessionProtection';
import { useProjectsState } from '../../hooks/useProjectsState';
import MobileNav from './MobileNav';

export default function AppContent() {
  const navigate = useNavigate();
  const { sessionId, projectId } = useParams<{ sessionId?: string; projectId?: string }>();
  const { t } = useTranslation('common');
  const { isMobile } = useDeviceSettings({ trackPWA: false });
  const { ws, sendMessage, latestMessage, isConnected } = useWebSocket();
  const wasConnectedRef = useRef(false);
  const startupResolvedRef = useRef(false);

  const {
    activeSessions,
    processingSessions,
    markSessionAsActive,
    markSessionAsInactive,
    markSessionAsProcessing,
    markSessionAsNotProcessing,
    replaceTemporarySession,
  } = useSessionProtection();

  const {
    selectedProject,
    selectedSession,
    activeTab,
    sidebarOpen,
    isLoadingProjects,
    isInputFocused,
    externalMessageUpdate,
    setActiveTab,
    setSidebarOpen,
    setIsInputFocused,
    setShowSettings,
    openSettings,
    refreshProjectsSilently,
    startupBehavior,
    lastOpenedSessionId,
    landingPageData,
    setLandingSearch,
    setLandingProjectFilter,
    setLandingWorkspaceFilter,
    setLandingSessionTypeFilter,
    toggleWorkspaceFavoriteByProjectName,
    toggleSessionFavoriteById,
    clearSelectedSessionSelection,
    sidebarSharedProps,
    handleProjectSelect,
    handleSessionSelect,
    handleNewSession,
    projects,
  } = useProjectsState({
    sessionId,
    projectId,
    navigate,
    latestMessage,
    isMobile,
    activeSessions,
  });

  const { rootViewMode, startupRestoreSessionId, openHomeView, openRootEmptyView, openEmptyShell } =
    useAppTabs({
      projects,
      selectedProject,
      selectedSession,
      sessionId,
      startupBehavior,
      lastOpenedSessionId,
      navigate,
      onRequestClearSession: clearSelectedSessionSelection,
    });

  const resolveSessionContext = useMemo(
    () => (targetSessionId: string) => {
      for (const project of projects) {
        const session = [
          ...(project.sessions ?? []),
          ...(project.codexSessions ?? []),
          ...(project.cursorSessions ?? []),
          ...(project.geminiSessions ?? []),
        ].find((entry) => entry.id === targetSessionId);

        if (session) {
          return {
            project,
            session: { ...session, __projectName: project.name },
          };
        }
      }

      return null;
    },
    [projects]
  );

  const showDesktopSidebar = true;

  useEffect(() => {
    // Chat/session flows call this bridge to refresh sidebar data without forcing a full loading state.
    window.refreshProjects = refreshProjectsSilently;

    return () => {
      if (window.refreshProjects === refreshProjectsSilently) {
        delete window.refreshProjects;
      }
    };
  }, [refreshProjectsSilently]);

  useEffect(() => {
    window.openSettings = openSettings;

    return () => {
      if (window.openSettings === openSettings) {
        delete window.openSettings;
      }
    };
  }, [openSettings]);

  useEffect(() => {
    if (sessionId) {
      startupResolvedRef.current = true;
      openEmptyShell();
      return;
    }

    if (projectId) {
      startupResolvedRef.current = true;
      openEmptyShell();
      return;
    }

    if (isLoadingProjects || startupResolvedRef.current) {
      return;
    }

    startupResolvedRef.current = true;

    if (startupRestoreSessionId) {
      openEmptyShell();
      navigate(`/session/${startupRestoreSessionId}`, { replace: true });
      return;
    }
    // The default root surface in Phase 2 is a global recent-sessions home, not the retired
    // landing page, so users can always recover into a navigable shell.
    openHomeView();
  }, [
    isLoadingProjects,
    navigate,
    openEmptyShell,
    openHomeView,
    projectId,
    sessionId,
    startupRestoreSessionId,
  ]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return undefined;
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const message = event.data;
      if (!message || message.type !== 'notification:navigate') {
        return;
      }

      if (typeof message.provider === 'string' && message.provider.trim()) {
        localStorage.setItem('selected-provider', message.provider);
      }

      setActiveTab('chat');
      setSidebarOpen(false);
      void refreshProjectsSilently();

      if (typeof message.sessionId === 'string' && message.sessionId) {
        navigate(`/session/${message.sessionId}`);
        return;
      }

      openHomeView();
      navigate('/');
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [navigate, openHomeView, refreshProjectsSilently, setActiveTab, setSidebarOpen]);

  // Permission recovery: query pending permissions on WebSocket reconnect or session change
  useEffect(() => {
    const isReconnect = isConnected && !wasConnectedRef.current;

    if (isReconnect) {
      wasConnectedRef.current = true;
    } else if (!isConnected) {
      wasConnectedRef.current = false;
    }

    if (isConnected && selectedSession?.id) {
      sendMessage({
        type: 'get-pending-permissions',
        sessionId: selectedSession.id,
      });
    }
  }, [isConnected, selectedSession?.id, sendMessage]);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      {!isMobile && showDesktopSidebar ? (
        <div className="h-full flex-shrink-0 border-r border-border/50">
          <Sidebar {...sidebarSharedProps} />
        </div>
      ) : null}

      {isMobile ? (
        <div
          className={`fixed inset-0 z-50 flex transition-all duration-150 ease-out ${
            sidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
        >
          <button
            className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-150 ease-out"
            onClick={(event) => {
              event.stopPropagation();
              setSidebarOpen(false);
            }}
            onTouchStart={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setSidebarOpen(false);
            }}
            aria-label={t('versionUpdate.ariaLabels.closeSidebar')}
          />
          <div
            className={`relative h-full w-[85vw] max-w-sm transform border-r border-border/40 bg-card transition-transform duration-150 ease-out sm:w-80 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            <Sidebar {...sidebarSharedProps} />
          </div>
        </div>
      ) : null}

      <div
        className={`flex min-w-0 flex-1 flex-col overflow-hidden ${isMobile ? 'pb-mobile-nav' : ''}`}
      >
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* State-only views such as landing and new-session have narrow intrinsic content.
					   Keep them inside an explicit flex item so the main canvas still fills the viewport. */}
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <MainContent
              projects={projects}
              selectedProject={selectedProject}
              selectedSession={selectedSession}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              ws={ws}
              sendMessage={sendMessage}
              latestMessage={latestMessage}
              isMobile={isMobile}
              onMenuClick={() => setSidebarOpen(true)}
              isLoading={isLoadingProjects}
              onInputFocusChange={setIsInputFocused}
              onSessionActive={markSessionAsActive}
              onSessionInactive={markSessionAsInactive}
              onSessionProcessing={markSessionAsProcessing}
              onSessionNotProcessing={markSessionAsNotProcessing}
              processingSessions={processingSessions}
              onReplaceTemporarySession={replaceTemporarySession}
              onNavigateToSession={(targetSessionId: string) =>
                navigate(`/session/${targetSessionId}`)
              }
              onOpenProjectSession={handleSessionSelect}
              onCreateProjectSession={handleNewSession}
              onShowSettings={() => setShowSettings(true)}
              externalMessageUpdate={externalMessageUpdate}
              showLandingPage={!sessionId && !projectId && rootViewMode === 'home'}
              forceEmptyState={!sessionId && Boolean(projectId) && !selectedProject}
              landingPageData={landingPageData}
              onLandingFiltersChange={{
                onSearchChange: setLandingSearch,
                onProjectChange: setLandingProjectFilter,
                onWorkspaceChange: setLandingWorkspaceFilter,
                onSessionTypeChange: setLandingSessionTypeFilter,
              }}
              onLandingActions={{
                onOpenWorkspace: (projectName: string) => {
                  const project = projects.find((entry) => entry.name === projectName);
                  if (project) {
                    openEmptyShell();
                    handleProjectSelect(project);
                  }
                },
                onOpenSession: (targetSessionId: string) => {
                  const context = resolveSessionContext(targetSessionId);
                  if (context) {
                    openEmptyShell();
                    handleSessionSelect(context.session);
                  }
                },
                onToggleWorkspaceFavorite: toggleWorkspaceFavoriteByProjectName,
                onToggleSessionFavorite: toggleSessionFavoriteById,
                onCreateSession: () => {
                  if (selectedProject) {
                    openEmptyShell();
                    handleNewSession(selectedProject);
                    return;
                  }

                  if (projects[0]) {
                    openEmptyShell();
                    handleNewSession(projects[0]);
                    return;
                  }
                },
                onCreateWorkspace: () => {
                  window.dispatchEvent(new CustomEvent('project-wizard:open'));
                },
              }}
            />
          </div>
        </div>

        {isMobile && (
          <MobileNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isInputFocused={isInputFocused}
          />
        )}
      </div>
    </div>
  );
}
