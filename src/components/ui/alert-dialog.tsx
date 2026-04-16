import {
  cloneElement,
  createContext,
  isValidElement,
  type ButtonHTMLAttributes,
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
import { buttonVariants } from './button';
import { overlayBackdropVariants, overlaySurfaceVariants } from './overlay-styles';
import { cn } from '@/lib/utils';

type AlertDialogContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
};

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext() {
  const context = useContext(AlertDialogContext);

  if (!context) {
    throw new Error('AlertDialog components must be used within AlertDialog');
  }

  return context;
}

export function AlertDialog({
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
    <AlertDialogContext.Provider
      value={{ open: resolvedOpen, onOpenChange: handleOpenChange, titleId, descriptionId }}
    >
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogTrigger({ children }: { children: ReactNode }) {
  const { onOpenChange } = useAlertDialogContext();

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
      'aria-haspopup': 'alertdialog',
    } as Record<string, unknown>
  );
}

export function AlertDialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { open, onOpenChange, titleId, descriptionId } = useAlertDialogContext();
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
    <div className={overlayBackdropVariants({ layer: 'viewport', tone: 'strong', blur: 'sm' })}>
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(
          overlaySurfaceVariants({ tone: 'card', size: 'md', radius: 'md', padding: 'default' }),
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function AlertDialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 space-y-1.5">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  const { titleId } = useAlertDialogContext();

  return (
    <h3 id={titleId} className="text-lg font-semibold text-foreground">
      {children}
    </h3>
  );
}

export function AlertDialogDescription({ children }: { children: ReactNode }) {
  const { descriptionId } = useAlertDialogContext();

  return (
    <p id={descriptionId} className="text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function AlertDialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2">{children}</div>;
}

type AlertDialogButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AlertDialogCancel({
  children,
  className,
  onClick,
  ...props
}: AlertDialogButtonProps) {
  const { onOpenChange } = useAlertDialogContext();

  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          onOpenChange(false);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({ children, className, ...props }: AlertDialogButtonProps) {
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: 'destructive', size: 'sm' }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
