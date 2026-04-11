import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
};

function getNextEnabledIndex(options: SelectOption[], startIndex: number, direction: 1 | -1) {
  if (options.length === 0) {
    return -1;
  }

  let currentIndex = startIndex;

  for (let step = 0; step < options.length; step += 1) {
    currentIndex = (currentIndex + direction + options.length) % options.length;
    if (!options[currentIndex]?.disabled) {
      return currentIndex;
    }
  }

  return -1;
}

export function Select({
  value,
  onValueChange,
  options,
  className,
  disabled = false,
}: SelectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value]
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [open]);

  const openDropdown = () => {
    if (disabled) {
      return;
    }

    const initialIndex =
      selectedIndex >= 0 && !options[selectedIndex]?.disabled
        ? selectedIndex
        : getNextEnabledIndex(options, -1, 1);

    setHighlightedIndex(initialIndex);
    setOpen(true);
  };

  const closeDropdown = () => {
    setOpen(false);
  };

  const selectOption = (option: SelectOption, index: number) => {
    if (option.disabled) {
      return;
    }

    onValueChange(option.value);
    setHighlightedIndex(index);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openDropdown();
        return;
      }

      setHighlightedIndex((currentIndex) => getNextEnabledIndex(options, currentIndex, 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openDropdown();
        return;
      }

      setHighlightedIndex((currentIndex) => getNextEnabledIndex(options, currentIndex, -1));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) {
        openDropdown();
        return;
      }

      if (highlightedIndex >= 0) {
        selectOption(options[highlightedIndex], highlightedIndex);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
      return;
    }

    if (event.key === 'Tab') {
      closeDropdown();
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => {
          if (open) {
            closeDropdown();
            return;
          }

          openDropdown();
        }}
        onKeyDown={handleKeyDown}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selectedOption?.label ?? value}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute z-50 mt-2 min-w-32 overflow-hidden rounded-md border border-border bg-surface-elevated p-1 shadow-md"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOption(option, index)}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-foreground outline-none',
                  isHighlighted && 'bg-accent text-accent-foreground',
                  option.disabled && 'pointer-events-none opacity-50'
                )}
              >
                {isSelected ? <Check className="absolute left-2 h-4 w-4" /> : null}
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
