import {
  cloneElement,
  createContext,
  isValidElement,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  overlayBackdropVariants,
  overlayCloseButtonClassName,
  sheetContentVariants,
} from './overlay-styles';
import { cn } from '@/lib/utils';

type SheetContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
};

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = useContext(SheetContext);

  if (!context) {
    throw new Error('Sheet components must be used within Sheet');
  }

  return context;
}

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const isControlled = typeof open === 'boolean';
  const resolvedOpen = isControlled ? open : internalOpen;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <SheetContext.Provider
      value={{ open: resolvedOpen, onOpenChange: handleOpenChange, titleId, descriptionId }}
    >
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({ children }: { children: ReactNode }) {
  const { onOpenChange } = useSheetContext();

  if (!isValidElement(children)) {
    return (
      <button type="button" onClick={() => onOpenChange(true)}>
        {children}
      </button>
    );
  }

  return cloneElement(
    children as ReactElement,
    {
      onClick: (event: ReactMouseEvent) => {
        children.props.onClick?.(event);
        onOpenChange(true);
      },
      'aria-haspopup': 'dialog',
    } as Record<string, unknown>
  );
}

export function SheetClose({ children }: { children: ReactNode }) {
  const { onOpenChange } = useSheetContext();

  if (!isValidElement(children)) {
    return (
      <button type="button" onClick={() => onOpenChange(false)}>
        {children}
      </button>
    );
  }

  return cloneElement(
    children as ReactElement,
    {
      onClick: (event: ReactMouseEvent) => {
        children.props.onClick?.(event);
        onOpenChange(false);
      },
    } as Record<string, unknown>
  );
}

export function SheetContent({
  children,
  className,
  side = 'right',
}: {
  children: ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  const { open, onOpenChange, titleId, descriptionId } = useSheetContext();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={overlayBackdropVariants({ layer: 'viewport', tone: 'subtle', blur: 'sm' })}>
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close sheet"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(sheetContentVariants({ side, state: open ? 'open' : 'closed' }), className)}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className={overlayCloseButtonClassName}
          aria-label="Close sheet"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function SheetHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 space-y-1.5">{children}</div>;
}

export function SheetTitle({ children }: { children: ReactNode }) {
  const { titleId } = useSheetContext();

  return (
    <h3 id={titleId} className="text-lg font-semibold text-foreground">
      {children}
    </h3>
  );
}

export function SheetDescription({ children }: { children: ReactNode }) {
  const { descriptionId } = useSheetContext();

  return (
    <p id={descriptionId} className="text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function SheetFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto flex justify-end gap-2 border-t border-border/70 p-4">{children}</div>
  );
}
