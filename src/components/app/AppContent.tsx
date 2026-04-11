import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from '../sidebar/view/Sidebar'
import MainContent from '../main-content/view/MainContent'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { useDeviceSettings } from '../../hooks/useDeviceSettings'
import { useSessionProtection } from '../../hooks/useSessionProtection'
import { useAppTabs } from '../../hooks/useAppTabs'
import { useProjectsState } from '../../hooks/useProjectsState'
import { useLayout } from '../../contexts/LayoutContext'
import MobileNav from './MobileNav'
import AppTabStrip from './view/AppTabStrip'
import PaneDropZone from './view/PaneDropZone'

export default function AppContent() {
	const navigate = useNavigate()
	const { sessionId } = useParams<{ sessionId?: string }>()
	const { t } = useTranslation('common')
	const { isMobile } = useDeviceSettings({ trackPWA: false })
	const { ws, sendMessage, latestMessage, isConnected } = useWebSocket()
	const wasConnectedRef = useRef(false)
	const startupResolvedRef = useRef(false)
	const [draggedShellTabId, setDraggedShellTabId] = useState<string | null>(null)

	const {
		activeSessions,
		processingSessions,
		markSessionAsActive,
		markSessionAsInactive,
		markSessionAsProcessing,
		markSessionAsNotProcessing,
		replaceTemporarySession,
	} = useSessionProtection()

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
		navigate,
		latestMessage,
		isMobile,
		activeSessions,
	})
	const { layoutMode, panes, setLayoutMode, setPaneContentTab, assignSessionToPane, clearPane } = useLayout()
	const { shellTabs, activeShellTabId, rootViewMode, setRootViewMode, selectShellTab, closeShellTab, activateHomeTab } =
		useAppTabs({
			selectedProject,
			selectedSession,
			sessionId,
			navigate,
			onRequestClearSession: clearSelectedSessionSelection,
		})

	const resolveSessionContext = useMemo(
		() => (targetSessionId: string) => {
			for (const project of projects) {
				const session = [
					...(project.sessions ?? []),
					...(project.codexSessions ?? []),
					...(project.cursorSessions ?? []),
					...(project.geminiSessions ?? []),
				].find(entry => entry.id === targetSessionId)

				if (session) {
					return {
						project,
						session: { ...session, __projectName: project.name },
					}
				}
			}

			return null
		},
		[projects],
	)

	const secondaryPane = panes.find(pane => pane.paneId === 'secondary')
	const secondaryPaneContext = secondaryPane?.sessionId ? resolveSessionContext(secondaryPane.sessionId) : null
	const secondaryActiveTab = secondaryPane?.activeContentTab || 'chat'
	// Show shell chrome (tab strip + pane layout) only when actively in a session or empty-new-session state.
	// The landing page never shows the chrome — including when a project is selected but no session is open.
	const showShellChrome = Boolean(sessionId || selectedSession || rootViewMode === 'empty')

	useEffect(() => {
		setPaneContentTab('primary', activeTab)
	}, [activeTab, setPaneContentTab])

	useEffect(() => {
		if (!selectedSession) {
			assignSessionToPane('primary', { sessionId: null, projectName: null, tabId: null })
			return
		}

		assignSessionToPane('primary', {
			sessionId: selectedSession.id,
			projectName: selectedProject?.name || selectedSession.__projectName || null,
			tabId: activeShellTabId,
			activeContentTab: activeTab,
		})
	}, [activeShellTabId, activeTab, assignSessionToPane, selectedProject?.name, selectedSession])

	useEffect(() => {
		// Expose a non-blocking refresh for chat/session flows.
		// Full loading refreshes are still available through direct fetchProjects calls.
		window.refreshProjects = refreshProjectsSilently

		return () => {
			if (window.refreshProjects === refreshProjectsSilently) {
				delete window.refreshProjects
			}
		}
	}, [refreshProjectsSilently])

	useEffect(() => {
		window.openSettings = openSettings

		return () => {
			if (window.openSettings === openSettings) {
				delete window.openSettings
			}
		}
	}, [openSettings])

	useEffect(() => {
		if (sessionId || isLoadingProjects || startupResolvedRef.current) {
			return
		}

		startupResolvedRef.current = true

		if (startupBehavior !== 'landing' && lastOpenedSessionId) {
			navigate(`/session/${lastOpenedSessionId}`, { replace: true })
			setRootViewMode('landing')
		}
	}, [isLoadingProjects, lastOpenedSessionId, navigate, sessionId, setRootViewMode, startupBehavior])

	useEffect(() => {
		if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
			return undefined
		}

		const handleServiceWorkerMessage = (event: MessageEvent) => {
			const message = event.data
			if (!message || message.type !== 'notification:navigate') {
				return
			}

			if (typeof message.provider === 'string' && message.provider.trim()) {
				localStorage.setItem('selected-provider', message.provider)
			}

			setActiveTab('chat')
			setSidebarOpen(false)
			void refreshProjectsSilently()

			if (typeof message.sessionId === 'string' && message.sessionId) {
				navigate(`/session/${message.sessionId}`)
				return
			}

			navigate('/')
		}

		navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

		return () => {
			navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
		}
	}, [navigate, refreshProjectsSilently, setActiveTab, setSidebarOpen])

	// Permission recovery: query pending permissions on WebSocket reconnect or session change
	useEffect(() => {
		const isReconnect = isConnected && !wasConnectedRef.current

		if (isReconnect) {
			wasConnectedRef.current = true
		} else if (!isConnected) {
			wasConnectedRef.current = false
		}

		if (isConnected && selectedSession?.id) {
			sendMessage({
				type: 'get-pending-permissions',
				sessionId: selectedSession.id,
			})
		}
	}, [isConnected, selectedSession?.id, sendMessage])

	return (
		<div className='fixed inset-0 flex overflow-hidden bg-background'>
			{!isMobile && showShellChrome ? (
				<div className='h-full flex-shrink-0 border-r border-border/50'>
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
						className='fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-150 ease-out'
						onClick={event => {
							event.stopPropagation()
							setSidebarOpen(false)
						}}
						onTouchStart={event => {
							event.preventDefault()
							event.stopPropagation()
							setSidebarOpen(false)
						}}
						aria-label={t('versionUpdate.ariaLabels.closeSidebar')}
					/>
					<div
						className={`relative h-full w-[85vw] max-w-sm transform border-r border-border/40 bg-card transition-transform duration-150 ease-out sm:w-80 ${
							sidebarOpen ? 'translate-x-0' : '-translate-x-full'
						}`}
						onClick={event => event.stopPropagation()}
						onTouchStart={event => event.stopPropagation()}
					>
						<Sidebar {...sidebarSharedProps} />
					</div>
				</div>
			) : null}

			<div className={`flex min-w-0 flex-1 flex-col overflow-hidden ${isMobile ? 'pb-mobile-nav' : ''}`}>
				{showShellChrome ? (
					<AppTabStrip
						tabs={shellTabs}
						activeTabId={activeShellTabId}
						layoutMode={layoutMode}
						onSelectTab={selectShellTab}
						onCloseTab={tabId => {
							const closingTab = shellTabs.find(tab => tab.id === tabId)
							if (closingTab?.sessionId === secondaryPane?.sessionId) {
								clearPane('secondary')
							}
							closeShellTab(tabId)
						}}
						onActivateHome={activateHomeTab}
						onAddTab={() => {
							if (selectedProject) {
								setRootViewMode('empty')
								handleNewSession(selectedProject)
								return
							}

							setRootViewMode('landing')
							navigate('/')
						}}
						onLayoutModeChange={mode => {
							setLayoutMode(mode)
							if (mode === 'single') {
								clearPane('secondary')
							}
						}}
						onOpenInNewPane={tabId => {
							const tab = shellTabs.find(entry => entry.id === tabId)
							if (!tab?.sessionId) {
								return
							}

							setLayoutMode('dual')
							assignSessionToPane('secondary', {
								sessionId: tab.sessionId,
								projectName: tab.projectName,
								tabId: tab.id,
							})
						}}
						onDragTabStart={setDraggedShellTabId}
						onDragTabEnd={() => setDraggedShellTabId(null)}
					/>
				) : null}

				<div
					className={`grid min-h-0 flex-1 overflow-hidden ${layoutMode === 'dual' ? 'md:grid-cols-2' : 'grid-cols-1'}`}
				>
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
						onNavigateToSession={(targetSessionId: string) => navigate(`/session/${targetSessionId}`)}
						onShowSettings={() => setShowSettings(true)}
						externalMessageUpdate={externalMessageUpdate}
						showLandingPage={!sessionId && rootViewMode === 'landing'}
						forceEmptyState={!sessionId && rootViewMode === 'empty' && !selectedProject}
						landingPageData={landingPageData}
						onLandingFiltersChange={{
							onSearchChange: setLandingSearch,
							onProjectChange: setLandingProjectFilter,
							onWorkspaceChange: setLandingWorkspaceFilter,
							onSessionTypeChange: setLandingSessionTypeFilter,
						}}
						onLandingActions={{
							onOpenWorkspace: (projectName: string) => {
								const project = projects.find(entry => entry.name === projectName)
								if (project) {
									setRootViewMode('empty')
									handleProjectSelect(project)
								}
							},
							onOpenSession: (targetSessionId: string) => {
								const context = resolveSessionContext(targetSessionId)
								if (context) {
									handleSessionSelect(context.session)
								}
							},
							onToggleWorkspaceFavorite: toggleWorkspaceFavoriteByProjectName,
							onToggleSessionFavorite: toggleSessionFavoriteById,
							onCreateSession: () => {
								if (selectedProject) {
									setRootViewMode('empty')
									handleNewSession(selectedProject)
									return
								}

								if (projects[0]) {
									setRootViewMode('empty')
									handleNewSession(projects[0])
									return
								}

								window.dispatchEvent(new CustomEvent('project-wizard:open'))
							},
							onCreateWorkspace: () => {
								window.dispatchEvent(new CustomEvent('project-wizard:open'))
							},
						}}
					/>

					{layoutMode === 'dual' ? (
						<MainContent
							projects={projects}
							selectedProject={secondaryPaneContext?.project || null}
							selectedSession={secondaryPaneContext?.session || null}
							activeTab={secondaryActiveTab}
							setActiveTab={value => {
								const nextTab = typeof value === 'function' ? value(secondaryActiveTab) : value
								setPaneContentTab('secondary', nextTab)
							}}
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
							onNavigateToSession={(targetSessionId: string) => navigate(`/session/${targetSessionId}`)}
							onShowSettings={() => setShowSettings(true)}
							externalMessageUpdate={externalMessageUpdate}
							showLandingPage={false}
							forceEmptyState={false}
							landingPageData={landingPageData}
							onLandingFiltersChange={{
								onSearchChange: setLandingSearch,
								onProjectChange: setLandingProjectFilter,
								onWorkspaceChange: setLandingWorkspaceFilter,
								onSessionTypeChange: setLandingSessionTypeFilter,
							}}
							onLandingActions={{
								onOpenWorkspace: () => undefined,
								onOpenSession: () => undefined,
								onToggleWorkspaceFavorite: () => undefined,
								onToggleSessionFavorite: () => undefined,
								onCreateSession: () => undefined,
								onCreateWorkspace: () => undefined,
							}}
						/>
					) : null}
				</div>
			</div>

			<PaneDropZone
				open={Boolean(draggedShellTabId) && !isMobile}
				onDropToPane={paneId => {
					if (!draggedShellTabId) {
						return
					}

					const draggedTab = shellTabs.find(tab => tab.id === draggedShellTabId)
					if (!draggedTab?.sessionId) {
						setDraggedShellTabId(null)
						return
					}

					const context = resolveSessionContext(draggedTab.sessionId)
					if (!context) {
						setDraggedShellTabId(null)
						return
					}

					if (paneId === 'primary') {
						navigate(`/session/${draggedTab.sessionId}`)
					} else {
						setLayoutMode('dual')
						assignSessionToPane('secondary', {
							sessionId: draggedTab.sessionId,
							projectName: context.project.name,
							tabId: draggedTab.id,
							activeContentTab: activeTab,
						})
					}

					setDraggedShellTabId(null)
				}}
			/>

			{isMobile && <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} isInputFocused={isInputFocused} />}
		</div>
	)
}
