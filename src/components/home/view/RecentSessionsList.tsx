import { Clock3, Star, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../ui/button'

export type RecentSessionItem = {
	id: string
	sessionId: string
	title: string
	projectName: string
	displayProjectName: string
	provider: string
	status: string
	lastActivityLabel: string
	summary?: string
	isFavorite: boolean
}

type RecentSessionsListProps = {
	sessions: RecentSessionItem[]
	onOpenSession: (sessionId: string) => void
	onToggleFavorite: (sessionId: string) => void
}

const STATUS_STYLES: Record<string, string> = {
	active: 'bg-emerald-500',
	paused: 'bg-amber-500',
	archived: 'bg-slate-400',
	idle: 'bg-sky-500',
}

export default function RecentSessionsList({ sessions, onOpenSession, onToggleFavorite }: RecentSessionsListProps) {
	const { t } = useTranslation('common')

	if (sessions.length === 0) {
		return (
			<section className='rounded-[32px] border border-border/70 bg-card/95 p-6 shadow-sm shadow-black/5'>
				<div className='mb-2 flex items-center gap-2 text-sm font-semibold text-foreground'>
					<Clock3 className='h-4 w-4 text-primary' />
					{t('landing.recentTitle')}
				</div>
				<p className='rounded-2xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground'>
					{t('landing.emptyRecentSessions')}
				</p>
			</section>
		)
	}

	return (
		<section className='rounded-[32px] border border-border/70 bg-card/95 p-6 shadow-sm shadow-black/5'>
			<div className='mb-4 flex items-center gap-2 text-sm font-semibold text-foreground'>
				<Clock3 className='h-4 w-4 text-primary' />
				{t('landing.recentTitle')}
			</div>

			<div className='space-y-3'>
				{sessions.map(session => (
					<div
						key={session.id}
						role='button'
						tabIndex={0}
						onClick={() => onOpenSession(session.sessionId)}
						onKeyDown={event => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault()
								onOpenSession(session.sessionId)
							}
						}}
						className='group w-full rounded-3xl border border-border/70 bg-background/95 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg'
					>
						<div className='flex items-start justify-between gap-3'>
							<div className='min-w-0 flex-1'>
								<div className='flex items-center gap-2'>
									<span
										className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_STYLES[session.status] || STATUS_STYLES.idle}`}
									/>
									<h4 className='truncate text-sm font-semibold text-foreground'>{session.title}</h4>
								</div>
								<p className='mt-1 text-xs text-muted-foreground'>
									{session.displayProjectName} · {session.provider} · {session.lastActivityLabel}
								</p>
								{session.summary ? (
									<p className='mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground'>{session.summary}</p>
								) : null}
							</div>

							<div className='flex items-center gap-2'>
								<Button
									type='button'
									variant='ghost'
									size='icon'
									className='h-9 w-9 rounded-full'
									onClick={event => {
										event.stopPropagation()
										onToggleFavorite(session.sessionId)
									}}
								>
									<Star
										className={`h-4 w-4 ${session.isFavorite ? 'fill-current text-primary' : 'text-muted-foreground'}`}
									/>
								</Button>
								<ArrowRight className='h-4 w-4 text-muted-foreground transition group-hover:text-primary' />
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
