import {
  useCallback,
  cloneElement,
  createContext,
  isValidElement,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

type DialogContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  contentId: string;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error('Dialog components must be used within Dialog');
  }

  return context;
}

export function Dialog({
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
  const contentId = useId();
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

  const value = {
    open: resolvedOpen,
    onOpenChange: handleOpenChange,
    titleId,
    contentId,
  };

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ children }: { children: ReactNode }) {
  const { onOpenChange } = useDialogContext();

  if (!isValidElement(children)) {
    return (
      <button type="button" data-testid="dialog-trigger" onClick={() => onOpenChange(true)}>
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
      'data-testid': 'dialog-trigger',
    } as Record<string, unknown>
  );
}

export function DialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { open, onOpenChange, titleId, contentId } = useDialogContext();
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
    <div
      className="fixed inset-0 z-50 bg-background/75 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div
        ref={panelRef}
        id={contentId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-large border border-border/70 bg-card p-6 text-foreground shadow-ring transition-opacity',
          className
        )}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-small absolute right-4 top-4 p-2 text-muted-foreground transition-opacity hover:text-foreground hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 space-y-1.5">{children}</div>;
}

export function DialogTitle({ children }: { children: ReactNode }) {
  const { titleId } = useDialogContext();

  return (
    <h3 id={titleId} className="text-lg font-semibold text-foreground">
      {children}
    </h3>
  );
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2">{children}</div>;
}
