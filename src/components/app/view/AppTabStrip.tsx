import { useEffect, useState } from 'react'
import { Home, Plus, X } from 'lucide-react'
import type { AppShellTab } from '../../../types/app'
import type { HomeLayoutMode } from '../../../types/home'
import { Button } from '../../ui/button'
import LayoutSwitcher from './LayoutSwitcher'
import TabContextMenu from './TabContextMenu'

type AppTabStripProps = {
	tabs: AppShellTab[]
	activeTabId: string
	layoutMode: HomeLayoutMode
	onSelectTab: (tabId: string) => void
	onCloseTab: (tabId: string) => void
	onActivateHome: () => void
	onAddTab: () => void
	onLayoutModeChange: (mode: HomeLayoutMode) => void
	onOpenInNewPane: (tabId: string) => void
	onDragTabStart: (tabId: string) => void
	onDragTabEnd: () => void
}

export default function AppTabStrip({
	tabs,
	activeTabId,
	layoutMode,
	onSelectTab,
	onCloseTab,
	onActivateHome,
	onAddTab,
	onLayoutModeChange,
	onOpenInNewPane,
	onDragTabStart,
	onDragTabEnd,
}: AppTabStripProps) {
	const [menuState, setMenuState] = useState<{ tabId: string; x: number; y: number } | null>(null)

	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setMenuState(null)
			}
		}

		window.addEventListener('keydown', handleEscape)
		return () => window.removeEventListener('keydown', handleEscape)
	}, [])

	return (
		<div className='flex items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur sm:px-4'>
			<div className='flex min-w-0 flex-1 items-center gap-2 overflow-x-auto'>
				{tabs.map(tab => {
					const isActive = tab.id === activeTabId
					const isHome = tab.kind === 'home'

					return (
						<div
							key={tab.id}
							draggable={!isHome}
							onDragStart={() => !isHome && onDragTabStart(tab.id)}
							onDragEnd={onDragTabEnd}
							onContextMenu={event => {
								if (isHome) {
									return
								}
								event.preventDefault()
								setMenuState({ tabId: tab.id, x: event.clientX, y: event.clientY })
							}}
							className={`group flex items-center gap-1 rounded-2xl border px-3 py-2 text-sm transition ${isActive ? 'border-primary/30 bg-primary/10 text-foreground shadow-sm' : 'border-border/60 bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground'}`}
						>
							<button
								type='button'
								onClick={() => (isHome ? onActivateHome() : onSelectTab(tab.id))}
								className='flex items-center gap-2'
							>
								{isHome ? <Home className='h-3.5 w-3.5' /> : null}
								<span className='max-w-44 truncate'>{tab.label}</span>
							</button>

							{!isHome ? (
								<button
									type='button'
									onClick={() => onCloseTab(tab.id)}
									className='rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground'
									aria-label={`Close ${tab.label}`}
								>
									<X className='h-3.5 w-3.5' />
								</button>
							) : null}
						</div>
					)
				})}

				<Button type='button' variant='ghost' size='icon' className='h-9 w-9 rounded-2xl' onClick={onAddTab}>
					<Plus className='h-4 w-4' />
				</Button>
			</div>

			<LayoutSwitcher layoutMode={layoutMode} onChange={onLayoutModeChange} />

			<TabContextMenu
				open={Boolean(menuState)}
				x={menuState?.x || 0}
				y={menuState?.y || 0}
				onClose={() => setMenuState(null)}
				onOpenInNewPane={() => {
					if (menuState) {
						onOpenInNewPane(menuState.tabId)
					}
				}}
				onCloseTab={() => {
					if (menuState) {
						onCloseTab(menuState.tabId)
					}
				}}
			/>
		</div>
	)
}
