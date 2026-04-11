import { createContext, useContext } from 'react'
import ReactDOM from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

type DialogContextValue = {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

export function Dialog({
	open,
	onOpenChange,
	children,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	children: React.ReactNode
}) {
	return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
	const context = useContext(DialogContext)

	if (!context?.open || typeof document === 'undefined') {
		return null
	}

	return ReactDOM.createPortal(
		<div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm'>
			<button
				type='button'
				className='absolute inset-0'
				aria-label='Close dialog'
				onClick={() => context.onOpenChange(false)}
			/>
			<div
				className={cn(
					'relative z-[71] w-full max-w-2xl rounded-3xl border border-border/70 bg-background p-6 shadow-2xl',
					className,
				)}
			>
				<button
					type='button'
					onClick={() => context.onOpenChange(false)}
					className='absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground'
					aria-label='Close dialog'
				>
					<X className='h-4 w-4' />
				</button>
				{children}
			</div>
		</div>,
		document.body,
	)
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
	return <div className='mb-4 space-y-1'>{children}</div>
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
	return <h3 className='text-lg font-semibold text-foreground'>{children}</h3>
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
	return <p className='text-sm text-muted-foreground'>{children}</p>
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
	return <div className='mt-5 flex justify-end gap-2'>{children}</div>
}
