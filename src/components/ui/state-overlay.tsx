import { createContext, type HTMLAttributes, type ReactNode, useContext, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { overlayBackdropVariants, overlaySurfaceVariants } from './overlay-styles';
import { cn } from '@/lib/utils';

type StateOverlayContextValue = {
  titleId: string;
  descriptionId: string;
};

const StateOverlayContext = createContext<StateOverlayContextValue | null>(null);

function useStateOverlayContext() {
  const context = useContext(StateOverlayContext);

  if (!context) {
    throw new Error('StateOverlay components must be used within StateOverlay');
  }

  return context;
}

type StateOverlayProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
} & VariantProps<typeof overlayBackdropVariants>;

export function StateOverlay({
  open,
  children,
  className,
  layer = 'surface',
  align = 'center',
  tone = 'soft',
  blur = 'sm',
  padding = 'default',
}: StateOverlayProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!open) {
    return null;
  }

  return (
    <StateOverlayContext.Provider value={{ titleId, descriptionId }}>
      <div
        className={cn(overlayBackdropVariants({ layer, align, tone, blur, padding }), className)}
      >
        {children}
      </div>
    </StateOverlayContext.Provider>
  );
}

type StateOverlayPanelProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof overlaySurfaceVariants>;

export function StateOverlayPanel({
  children,
  className,
  tone,
  size,
  radius,
  padding,
  ...props
}: StateOverlayPanelProps) {
  const { titleId, descriptionId } = useStateOverlayContext();

  return (
    <div
      className={cn(overlaySurfaceVariants({ tone, size, radius, padding }), className)}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      {...props}
    >
      {children}
    </div>
  );
}

export function StateOverlayEyebrow({ children, className }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[11px] uppercase tracking-[0.24em] text-muted-foreground', className)}>
      {children}
    </p>
  );
}

export function StateOverlayTitle({ children, className }: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useStateOverlayContext();

  return (
    <h3 id={titleId} className={cn('text-[18px] font-semibold text-foreground', className)}>
      {children}
    </h3>
  );
}

export function StateOverlayDescription({
  children,
  className,
}: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useStateOverlayContext();

  return (
    <p id={descriptionId} className={cn('text-sm leading-6 text-muted-foreground', className)}>
      {children}
    </p>
  );
}

const stateOverlayActionsVariants = cva('flex flex-wrap gap-3', {
  variants: {
    align: {
      start: 'justify-start',
      end: 'justify-end',
      between: 'justify-between',
    },
  },
  defaultVariants: {
    align: 'start',
  },
});

type StateOverlayActionsProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof stateOverlayActionsVariants>;

export function StateOverlayActions({
  children,
  className,
  align,
  ...props
}: StateOverlayActionsProps) {
  return (
    <div className={cn(stateOverlayActionsVariants({ align }), className)} {...props}>
      {children}
    </div>
  );
}
