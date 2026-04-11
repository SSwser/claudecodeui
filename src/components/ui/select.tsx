import { cn } from '../../lib/utils'

export type SelectOption = {
	value: string
	label: string
}

type SelectProps = {
	value: string
	onValueChange: (value: string) => void
	options: SelectOption[]
	className?: string
	disabled?: boolean
}

export function Select({ value, onValueChange, options, className, disabled = false }: SelectProps) {
	return (
		<select
			value={value}
			onChange={event => onValueChange(event.target.value)}
			disabled={disabled}
			className={cn(
				'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
		>
			{options.map(option => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	)
}
