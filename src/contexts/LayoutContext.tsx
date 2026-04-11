import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useHomePreferences } from '../hooks/useHomePreferences'
import type { HomeLayoutMode, HomePaneId } from '../types/home'

type LayoutContextValue = {
	layoutMode: HomeLayoutMode
	activePane: HomePaneId
	panes: ReturnType<typeof useHomePreferences>['preferences']['layout']['panes']
	setLayoutMode: (mode: HomeLayoutMode) => void
	setActivePane: (paneId: HomePaneId) => void
	setPaneContentTab: (
		paneId: HomePaneId,
		activeContentTab: ReturnType<
			typeof useHomePreferences
		>['preferences']['layout']['panes'][number]['activeContentTab'],
	) => void
	assignSessionToPane: (
		paneId: HomePaneId,
		payload: {
			sessionId: string | null
			projectName?: string | null
			tabId?: string | null
			activeContentTab?: ReturnType<
				typeof useHomePreferences
			>['preferences']['layout']['panes'][number]['activeContentTab']
		},
	) => void
	clearPane: (paneId: HomePaneId) => void
	swapPanes: () => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
	const { preferences, setLayoutMode, setActivePane, setPaneContentTab, assignSessionToPane, setLayout } =
		useHomePreferences()

	const value = useMemo<LayoutContextValue>(() => {
		const clearPane = (paneId: HomePaneId) => {
			assignSessionToPane(paneId, {
				sessionId: null,
				projectName: null,
				tabId: null,
			})
		}

		const swapPanes = () => {
			const [primary, secondary] = preferences.layout.panes
			setLayout({
				panes: [
					{ ...secondary, paneId: 'primary' },
					{ ...primary, paneId: 'secondary' },
				],
			})
		}

		return {
			layoutMode: preferences.layout.mode,
			activePane: preferences.layout.activePane,
			panes: preferences.layout.panes,
			setLayoutMode,
			setActivePane,
			setPaneContentTab,
			assignSessionToPane,
			clearPane,
			swapPanes,
		}
	}, [assignSessionToPane, preferences.layout, setActivePane, setLayout, setLayoutMode, setPaneContentTab])

	return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export function useLayout() {
	const context = useContext(LayoutContext)
	if (!context) {
		throw new Error('useLayout must be used within a LayoutProvider')
	}

	return context
}
