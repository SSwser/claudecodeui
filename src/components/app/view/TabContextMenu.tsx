import { X } from 'lucide-react'

type TabContextMenuProps = {
	open: boolean
	x: number
	y: number
	onClose: () => void
	onCloseTab: () => void
}

export default function TabContextMenu({ open, x, y, onClose, onCloseTab }: TabContextMenuProps) {
	if (!open) {
		return null
	}

	return (
		<>
			<button
				type='button'
				className='fixed inset-0 z-[75] cursor-default'
				onClick={onClose}
				aria-label='Close tab menu'
			/>
			<div
				className='fixed z-[76] min-w-40 rounded-2xl border border-border/70 bg-popover p-1.5 shadow-2xl'
				style={{ left: x, top: y }}
			>
				<button
					type='button'
					onClick={() => {
						onCloseTab()
						onClose()
					}}
					className='flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted'
				>
					<X className='h-4 w-4' />
					Close Tab
				</button>
			</div>
		</>
	)
}
