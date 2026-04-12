import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeviceSettings } from '../../../hooks/useDeviceSettings'
import { useVersionCheck } from '../../../hooks/useVersionCheck'
import { useUiPreferences } from '../../../hooks/useUiPreferences'
import { useSidebarController } from '../hooks/useSidebarController'
import { useTaskMaster } from '../../../contexts/TaskMasterContext'
import type { Project, SessionProvider } from '../../../types/app'
import type { SidebarProps } from '../types/types'
import { getAllSessions } from '../utils/utils'
import SidebarCollapsed from './subcomponents/SidebarCollapsed'
import SidebarContent from './subcomponents/SidebarContent'
import SidebarModals from './subcomponents/SidebarModals'

function normalizeCreatedProject(project?: Record<string, unknown> | null): Project | null {
	if (!project || typeof project.name !== 'string') {
		return null
	}

	const directoryPath = typeof project.directoryPath === 'string' ? project.directoryPath : ''
	const displayName = typeof project.displayName === 'string' && project.displayName.trim()
		? project.displayName
		: project.name

	return {
		id: typeof project.id === 'number' ? project.id : undefined,
		name: project.name,
		displayName,
		fullPath: directoryPath,
		path: directoryPath,
		directoryPath,
		multiWorkspaceEnabled: Boolean(project.multiWorkspaceEnabled),
		sessions: [],
		cursorSessions: [],
		codexSessions: [],
		geminiSessions: [],
	}
}

type TaskMasterSidebarContext = {
	setCurrentProject: (project: Project) => void
}

function Sidebar({
	projects,
	selectedProject,
	onProjectSelect,
	onOpenSession,
	onProjectDelete,
	isLoading,
	loadingProgress,
	onRefresh,
	onShowSettings,
	showSettings,
	settingsInitialTab,
	onCloseSettings,
	isMobile,
}: SidebarProps) {
	const { t } = useTranslation(['sidebar', 'common'])
	const { isPWA } = useDeviceSettings({ trackMobile: false })
	const { updateAvailable, latestVersion, currentVersion, releaseInfo, installMode } = useVersionCheck(
		'siteboon',
		'claudecodeui',
	)
	const { preferences, setPreference } = useUiPreferences()
	const { sidebarVisible } = preferences
	const { setCurrentProject } = useTaskMaster() as TaskMasterSidebarContext

	const {
		isSidebarCollapsed,
		editingProject,
		showNewProject,
		editingName,
		isRefreshing,
		searchFilter,
		searchMode,
		setSearchMode,
		conversationResults,
		isSearching,
		searchProgress,
		clearConversationResults,
		deletingProjects,
		deleteConfirmation,
		showVersionModal,
		sidebarProjects,
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
		collapseSidebar: handleCollapseSidebar,
		expandSidebar: handleExpandSidebar,
		setShowNewProject,
		setEditingName,
		setSearchFilter,
		setDeleteConfirmation,
		setShowVersionModal,
	} = useSidebarController({
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
		setSidebarVisible: visible => setPreference('sidebarVisible', visible),
		sidebarVisible,
	})

	useEffect(() => {
		if (typeof document === 'undefined') {
			return
		}

		document.documentElement.classList.toggle('pwa-mode', isPWA)
		document.body.classList.toggle('pwa-mode', isPWA)
	}, [isPWA])

	useEffect(() => {
		const handleOpenProjectWizard = () => {
			setShowNewProject(true)
		}

		window.addEventListener('project-wizard:open', handleOpenProjectWizard)

		return () => {
			window.removeEventListener('project-wizard:open', handleOpenProjectWizard)
		}
	}, [setShowNewProject])

	const handleProjectCreated = async (project?: Record<string, unknown>) => {
		const normalizedProject = normalizeCreatedProject(project)

		if (window.refreshProjects) {
			await window.refreshProjects()
		}

		if (normalizedProject) {
			handleProjectSelect(normalizedProject)
			setShowNewProject(false)
			return
		}

		window.location.reload()
	}

	return (
		<>
			<SidebarModals
				projects={projects}
				showSettings={showSettings}
				settingsInitialTab={settingsInitialTab}
				onCloseSettings={onCloseSettings}
				showNewProject={showNewProject}
				onCloseNewProject={() => setShowNewProject(false)}
				onProjectCreated={handleProjectCreated}
				deleteConfirmation={deleteConfirmation}
				onCancelDeleteProject={() => setDeleteConfirmation(null)}
				onConfirmDeleteProject={confirmDeleteProject}
				showVersionModal={showVersionModal}
				onCloseVersionModal={() => setShowVersionModal(false)}
				releaseInfo={releaseInfo}
				currentVersion={currentVersion}
				latestVersion={latestVersion}
				installMode={installMode}
				t={t}
			/>

			{isSidebarCollapsed ? (
				<SidebarCollapsed
					onExpand={handleExpandSidebar}
					onShowSettings={onShowSettings}
					updateAvailable={updateAvailable}
					onShowVersionModal={() => setShowVersionModal(true)}
					t={t}
				/>
			) : (
				<SidebarContent
					isPWA={isPWA}
					isMobile={isMobile}
					isLoading={isLoading}
					loadingProgress={loadingProgress}
					projects={projects}
					selectedProject={selectedProject}
					recentSessions={recentSessions}
					sidebarProjects={sidebarProjects}
					activeWorkspaceName={activeWorkspaceName}
					searchFilter={searchFilter}
					onSearchFilterChange={setSearchFilter}
					onClearSearchFilter={() => setSearchFilter('')}
					searchMode={searchMode}
					onSearchModeChange={(mode: 'projects' | 'conversations') => {
						setSearchMode(mode)
						if (mode === 'projects') clearConversationResults()
					}}
					conversationResults={conversationResults}
					isSearching={isSearching}
					searchProgress={searchProgress}
					onConversationResultClick={(
						projectName: string,
						sessionId: string,
						provider: string,
						messageTimestamp?: string | null,
						messageSnippet?: string | null,
					) => {
						const resolvedProvider = (provider || 'claude') as SessionProvider
						const project = projects.find(entry => entry.name === projectName) || null
						const searchTarget = {
							__searchTargetTimestamp: messageTimestamp || null,
							__searchTargetSnippet: messageSnippet || null,
						}
						const existingSession = project
							? getAllSessions(project, {}).find(session => session.id === sessionId)
							: null
						const sessionObj = existingSession
							? { ...existingSession, ...searchTarget }
							: {
								id: sessionId,
								__provider: resolvedProvider,
								__projectName: projectName,
								...searchTarget,
							  }

						openSessionFromSidebar(sessionObj, project)
					}}
					onRefresh={() => {
						void refreshProjects()
					}}
					isRefreshing={isRefreshing}
					onCreateProject={() => setShowNewProject(true)}
					editingProject={editingProject}
					editingName={editingName}
					deletingProjects={deletingProjects}
					onEditingNameChange={setEditingName}
					onProjectSelect={handleProjectSelect}
					onStartEditingProject={startEditing}
					onCancelEditingProject={cancelEditing}
					onSaveProjectName={projectName => {
						void saveProjectName(projectName)
					}}
					onDeleteProject={requestProjectDelete}
					onRecentSessionSelect={recentSession => {
						openSessionFromSidebar(recentSession.session, recentSession.project)
					}}
					onCollapseSidebar={handleCollapseSidebar}
					updateAvailable={updateAvailable}
					releaseInfo={releaseInfo}
					latestVersion={latestVersion}
					onShowVersionModal={() => setShowVersionModal(true)}
					onShowSettings={onShowSettings}
					t={t}
				/>
			)}
		</>
	)
}

export default Sidebar
