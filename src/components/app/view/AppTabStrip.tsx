import { useEffect, useState } from 'react'
import { Home, Plus, X } from 'lucide-react'
import type { AppShellTab } from '../../../types/app'
import { Button } from '../../ui/button'
import TabContextMenu from './TabContextMenu'

type AppTabStripProps = {
	tabs: AppShellTab[]
	activeTabId: string
	onSelectTab: (tabId: string) => void
	onCloseTab: (tabId: string) => void
	onActivateHome: () => void
	onAddTab: () => void
}

export default function AppTabStrip({
	tabs,
	activeTabId,
	onSelectTab,
	onCloseTab,
	onActivateHome,
	onAddTab,
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
		<div className='flex items-center gap-2 border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur sm:px-4'>
			<div className='flex min-w-0 flex-1 items-center gap-2 overflow-x-auto'>
				{tabs.map(tab => {
					const isActive = tab.id === activeTabId
					const isHome = tab.kind === 'home'

					return (
						<div
							key={tab.id}
							onContextMenu={event => {
								if (isHome) {
									return
								}
								event.preventDefault()
								setMenuState({ tabId: tab.id, x: event.clientX, y: event.clientY })
							}}
							className={`group flex shrink-0 items-center gap-1 rounded-2xl border px-3 py-2 text-sm ${isActive ? 'border-primary/30 bg-primary/10 text-foreground shadow-sm' : 'border-border/60 bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground'}`}
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
									onMouseDown={e => {
										e.preventDefault()
										e.stopPropagation()
									}}
									onClick={e => {
										e.stopPropagation()
										onCloseTab(tab.id)
									}}
									className='rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground'
									aria-label={`Close ${tab.label}`}
								>
									<X className='h-3.5 w-3.5' />
								</button>
							) : null}
						</div>
					)
				})}
			</div>

			<Button
				type='button'
				variant='ghost'
				size='icon'
				className='h-9 w-9 flex-shrink-0 rounded-2xl'
				onClick={onAddTab}
			>
				<Plus className='h-4 w-4' />
			</Button>

			<TabContextMenu
				open={Boolean(menuState)}
				x={menuState?.x || 0}
				y={menuState?.y || 0}
				onClose={() => setMenuState(null)}
				onCloseTab={() => {
					if (menuState) {
						onCloseTab(menuState.tabId)
					}
				}}
			/>
		</div>
	)
}
