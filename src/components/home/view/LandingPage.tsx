import { FolderPlus, MessageSquarePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import FavoritesSection, { type FavoriteSessionCard, type FavoriteWorkspaceCard } from './FavoritesSection'
import HomeFilters from './HomeFilters'
import RecentSessionsList, { type RecentSessionItem } from './RecentSessionsList'
import { Button } from '../../ui/button'
import type { SelectOption } from '../../ui/select'

export type LandingPageViewModel = {
	filters: {
		search: string
		project: string | null
		workspace: string | null
		sessionType: string
	}
	favoriteWorkspaces: FavoriteWorkspaceCard[]
	favoriteSessions: FavoriteSessionCard[]
	recentSessions: RecentSessionItem[]
	projectOptions: SelectOption[]
	workspaceOptions: SelectOption[]
}

type LandingPageProps = {
	viewModel: LandingPageViewModel
	onSearchChange: (value: string) => void
	onProjectChange: (value: string | null) => void
	onWorkspaceChange: (value: string | null) => void
	onSessionTypeChange: (value: string) => void
	onOpenWorkspace: (projectName: string) => void
	onOpenSession: (sessionId: string) => void
	onToggleWorkspaceFavorite: (projectName: string, displayName: string, path?: string) => void
	onToggleSessionFavorite: (sessionId: string) => void
	onCreateSession: () => void
	onCreateWorkspace: () => void
}

export default function LandingPage({
	viewModel,
	onSearchChange,
	onProjectChange,
	onWorkspaceChange,
	onSessionTypeChange,
	onOpenWorkspace,
	onOpenSession,
	onToggleWorkspaceFavorite,
	onToggleSessionFavorite,
	onCreateSession,
	onCreateWorkspace,
}: LandingPageProps) {
	const { t } = useTranslation('common')

	return (
		<div className='min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(255,255,255,1))] px-4 py-5 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,1))] sm:px-6 lg:px-8'>
			<div className='mx-auto flex max-w-7xl flex-col gap-6'>
				<section className='rounded-[36px] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 sm:p-8'>
					<div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
						<div className='max-w-2xl'>
							<p className='text-xs font-semibold uppercase tracking-[0.22em] text-primary'>CloudCLI UI</p>
							<h1 className='mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl'>
								{t('landing.title')}
							</h1>
							<p className='mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base'>
								{t('landing.subtitle')}
							</p>
						</div>

						<div className='flex flex-col gap-3 sm:flex-row'>
							<Button onClick={onCreateSession} className='h-11 rounded-2xl px-5'>
								<MessageSquarePlus className='h-4 w-4' />
								{t('landing.createSession')}
							</Button>
							<Button variant='outline' onClick={onCreateWorkspace} className='h-11 rounded-2xl px-5'>
								<FolderPlus className='h-4 w-4' />
								{t('landing.createWorkspace')}
							</Button>
						</div>
					</div>
				</section>

				<HomeFilters
					search={viewModel.filters.search}
					project={viewModel.filters.project}
					workspace={viewModel.filters.workspace}
					sessionType={viewModel.filters.sessionType}
					projectOptions={viewModel.projectOptions}
					workspaceOptions={viewModel.workspaceOptions}
					onSearchChange={onSearchChange}
					onProjectChange={onProjectChange}
					onWorkspaceChange={onWorkspaceChange}
					onSessionTypeChange={onSessionTypeChange}
				/>

				<div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
					<FavoritesSection
						workspaces={viewModel.favoriteWorkspaces}
						sessions={viewModel.favoriteSessions}
						onOpenWorkspace={onOpenWorkspace}
						onOpenSession={onOpenSession}
						onToggleWorkspaceFavorite={onToggleWorkspaceFavorite}
						onToggleSessionFavorite={onToggleSessionFavorite}
					/>

					<RecentSessionsList
						sessions={viewModel.recentSessions}
						onOpenSession={onOpenSession}
						onToggleFavorite={onToggleSessionFavorite}
					/>
				</div>
			</div>
		</div>
	)
}
