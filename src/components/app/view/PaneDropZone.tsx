type PaneDropZoneProps = {
	open: boolean
	onDropToPane: (paneId: 'primary' | 'secondary') => void
}

export default function PaneDropZone({ open, onDropToPane }: PaneDropZoneProps) {
	if (!open) {
		return null
	}

	return (
		<div className='pointer-events-none fixed inset-0 z-[72] hidden md:block'>
			<div
				className='pointer-events-auto absolute inset-y-20 left-4 w-24 rounded-3xl border border-dashed border-primary/50 bg-primary/10'
				onDragOver={event => event.preventDefault()}
				onDrop={() => onDropToPane('primary')}
			/>
			<div
				className='pointer-events-auto absolute inset-y-20 right-4 w-24 rounded-3xl border border-dashed border-primary/50 bg-primary/10'
				onDragOver={event => event.preventDefault()}
				onDrop={() => onDropToPane('secondary')}
			/>
		</div>
	)
}
