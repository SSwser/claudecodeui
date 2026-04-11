import { Columns2, Square } from 'lucide-react'
import { Button } from '../../ui/button'
import type { HomeLayoutMode } from '../../../types/home'

type LayoutSwitcherProps = {
	layoutMode: HomeLayoutMode
	onChange: (mode: HomeLayoutMode) => void
}

export default function LayoutSwitcher({ layoutMode, onChange }: LayoutSwitcherProps) {
	return (
		<div className='flex items-center gap-1 rounded-2xl border border-border/60 bg-background/90 p-1'>
			<Button
				type='button'
				variant={layoutMode === 'single' ? 'default' : 'ghost'}
				size='sm'
				className='h-8 rounded-xl px-3'
				onClick={() => onChange('single')}
			>
				<Square className='h-3.5 w-3.5' />
			</Button>
			<Button
				type='button'
				variant={layoutMode === 'dual' ? 'default' : 'ghost'}
				size='sm'
				className='h-8 rounded-xl px-3'
				onClick={() => onChange('dual')}
			>
				<Columns2 className='h-3.5 w-3.5' />
			</Button>
		</div>
	)
}
