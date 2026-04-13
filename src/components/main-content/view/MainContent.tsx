import React, { useEffect, useState } from 'react';
import ChatInterface from '@/components/chat/view/ChatInterface';
import FileTree from '@/components/file-tree/view/FileTree';
import StandaloneShell from '@/components/standalone-shell/view/StandaloneShell';
import GitPanel from '@/components/git-panel/view/GitPanel';
import PluginTabContent from '@/components/plugins/view/PluginTabContent';
import type { MainContentProps } from '../types/types';
import { useTaskMaster } from '@/contexts/TaskMasterContext';
import { useTasksSettings } from '@/contexts/TasksSettingsContext';
import { useUiPreferences } from '@/hooks/useUiPreferences';
import { useEditorSidebar } from '@/components/code-editor/hooks/useEditorSidebar';
import EditorSidebar from '@/components/code-editor/view/EditorSidebar';
import type { Project } from '@/types/app';
import { TaskMasterPanel } from '@/components/task-master';
import MainContentHeader from './subcomponents/MainContentHeader';
import MainContentStateView from './subcomponents/MainContentStateView';
import ErrorBoundary from './ErrorBoundary';
import ProjectInbox from '@/components/project-inbox/view/ProjectInbox';

type TaskMasterContextValue = {
  currentProject?: Project | null;
  setCurrentProject?: ((project: Project) => void) | null;
};

type TasksSettingsContextValue = {
  tasksEnabled: boolean;
  isTaskMasterInstalled: boolean | null;
  isTaskMasterReady: boolean | null;
};

function MainContent({
  projects,
  selectedProject,
  selectedSession,
  activeTab,
  setActiveTab,
  ws,
  sendMessage,
  latestMessage,
  isMobile,
  onMenuClick,
  isLoading,
  onInputFocusChange,
  onSessionActive,
  onSessionInactive,
  onSessionProcessing,
  onSessionNotProcessing,
  processingSessions,
  onReplaceTemporarySession,
  onNavigateToSession,
  onOpenProjectSession,
  onCreateProjectSession,
  onShowSettings,
  externalMessageUpdate,
  showLandingPage,
  forceEmptyState = false,
  landingPageData,
  onLandingFiltersChange,
  onLandingActions,
}: MainContentProps) {
  const { preferences } = useUiPreferences();
  const { autoExpandTools, showRawParameters, showThinking, autoScrollToBottom, sendByCtrlEnter } =
    preferences;

  const { currentProject, setCurrentProject } = useTaskMaster() as TaskMasterContextValue;
  const { tasksEnabled, isTaskMasterInstalled } = useTasksSettings() as TasksSettingsContextValue;

  const shouldShowTasksTab = Boolean(tasksEnabled && isTaskMasterInstalled);

  // Search query lifted here so the ghost search in the header tabs row and
  // the ProjectInbox list share a single source of truth.
  const [pvSearch, setPvSearch] = useState('');

  // Running count: sessions where the AI is actively generating a response.
  // processingSessions is a Set<sessionId> maintained by the chat components.
  const pvRunningCount = processingSessions.size;

  const {
    editingFile,
    editorWidth,
    editorExpanded,
    hasManualWidth,
    resizeHandleRef,
    handleFileOpen,
    handleCloseEditor,
    handleToggleEditorExpand,
    handleResizeStart,
  } = useEditorSidebar({
    selectedProject,
    isMobile,
  });

  useEffect(() => {
    const selectedProjectName = selectedProject?.name;
    const currentProjectName = currentProject?.name;

    if (selectedProject && selectedProjectName !== currentProjectName) {
      setCurrentProject?.(selectedProject);
    }
  }, [selectedProject, currentProject?.name, setCurrentProject]);

  useEffect(() => {
    if (!shouldShowTasksTab && activeTab === 'tasks') {
      setActiveTab('chat');
    }
  }, [shouldShowTasksTab, activeTab, setActiveTab]);

  if (isLoading) {
    return <MainContentStateView mode="loading" isMobile={isMobile} onMenuClick={onMenuClick} />;
  }

  if (showLandingPage) {
    return (
      <MainContentStateView
        mode="home"
        isMobile={isMobile}
        onMenuClick={onMenuClick}
        landingPageData={landingPageData}
        onLandingFiltersChange={onLandingFiltersChange}
        onLandingActions={onLandingActions}
      />
    );
  }

  if (forceEmptyState) {
    return (
      <MainContentStateView
        mode="empty"
        isMobile={isMobile}
        onMenuClick={onMenuClick}
        onCreateProject={onLandingActions?.onCreateWorkspace}
      />
    );
  }

  if (!selectedProject) {
    return (
      <MainContentStateView
        mode="empty"
        isMobile={isMobile}
        onMenuClick={onMenuClick}
        onCreateProject={onLandingActions?.onCreateWorkspace}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <MainContentHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedProject={selectedProject}
        selectedSession={selectedSession}
        shouldShowTasksTab={shouldShowTasksTab}
        isMobile={isMobile}
        onMenuClick={onMenuClick}
        onCreateSession={() => onCreateProjectSession(selectedProject)}
        runningCount={pvRunningCount}
        searchQuery={pvSearch}
        onSearchQueryChange={setPvSearch}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className={`flex min-h-0 min-w-[200px] flex-col overflow-hidden ${editorExpanded ? 'hidden' : ''} flex-1`}
        >
          <div className={`h-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
            {!selectedSession ? (
              <ProjectInbox
                projectId={selectedProject.id || 0}
                projectName={selectedProject.name}
                projectDisplayName={selectedProject.displayName}
                initialWorkspaceId={
                  typeof selectedProject._workspaceId === 'number'
                    ? selectedProject._workspaceId
                    : undefined
                }
                searchQuery={pvSearch}
                onSearchQueryChange={setPvSearch}
                onOpenSession={onOpenProjectSession}
                onCreateSession={() => onCreateProjectSession(selectedProject)}
              />
            ) : (
              <ErrorBoundary showDetails>
                <ChatInterface
                  selectedProject={selectedProject}
                  selectedSession={selectedSession}
                  ws={ws}
                  sendMessage={sendMessage}
                  latestMessage={latestMessage}
                  onFileOpen={handleFileOpen}
                  onInputFocusChange={onInputFocusChange}
                  onSessionActive={onSessionActive}
                  onSessionInactive={onSessionInactive}
                  onSessionProcessing={onSessionProcessing}
                  onSessionNotProcessing={onSessionNotProcessing}
                  processingSessions={processingSessions}
                  onReplaceTemporarySession={onReplaceTemporarySession}
                  onNavigateToSession={onNavigateToSession}
                  onShowSettings={onShowSettings}
                  autoExpandTools={autoExpandTools}
                  showRawParameters={showRawParameters}
                  showThinking={showThinking}
                  autoScrollToBottom={autoScrollToBottom}
                  sendByCtrlEnter={sendByCtrlEnter}
                  externalMessageUpdate={externalMessageUpdate}
                  onShowAllTasks={tasksEnabled ? () => setActiveTab('tasks') : null}
                />
              </ErrorBoundary>
            )}
          </div>

          {activeTab === 'files' && (
            <div className="h-full overflow-hidden">
              <FileTree selectedProject={selectedProject} onFileOpen={handleFileOpen} />
            </div>
          )}

          {activeTab === 'shell' && (
            <div className="h-full w-full overflow-hidden">
              <StandaloneShell
                project={selectedProject}
                session={selectedSession}
                showHeader={false}
                isActive={activeTab === 'shell'}
              />
            </div>
          )}

          {activeTab === 'git' && (
            <div className="h-full overflow-hidden">
              <GitPanel
                selectedProject={selectedProject}
                isMobile={isMobile}
                onFileOpen={handleFileOpen}
              />
            </div>
          )}

          {shouldShowTasksTab && <TaskMasterPanel isVisible={activeTab === 'tasks'} />}

          <div
            className={`h-full overflow-hidden ${activeTab === 'preview' ? 'block' : 'hidden'}`}
          />

          {activeTab.startsWith('plugin:') && (
            <div className="h-full overflow-hidden">
              <PluginTabContent
                pluginName={activeTab.replace('plugin:', '')}
                selectedProject={selectedProject}
                selectedSession={selectedSession}
              />
            </div>
          )}
        </div>

        <EditorSidebar
          editingFile={editingFile}
          isMobile={isMobile}
          editorExpanded={editorExpanded}
          editorWidth={editorWidth}
          hasManualWidth={hasManualWidth}
          resizeHandleRef={resizeHandleRef}
          onResizeStart={handleResizeStart}
          onCloseEditor={handleCloseEditor}
          onToggleEditorExpand={handleToggleEditorExpand}
          projectPath={selectedProject.path}
          fillSpace={activeTab === 'files'}
        />
      </div>
    </div>
  );
}

export default React.memo(MainContent);
