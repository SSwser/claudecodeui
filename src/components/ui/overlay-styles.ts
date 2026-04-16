import { cva } from 'class-variance-authority';

export const overlayBackdropVariants = cva('pointer-events-auto flex', {
  variants: {
    layer: {
      viewport: 'fixed inset-0 z-50',
      surface: 'absolute inset-0 z-20',
    },
    align: {
      center: 'items-center justify-center',
      top: 'items-start justify-center',
      bottom: 'items-end justify-center',
      stretch: 'items-stretch justify-stretch',
    },
    tone: {
      subtle: 'bg-background/72',
      soft: 'bg-background/88',
      strong: 'bg-black/60',
    },
    blur: {
      none: '',
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
    },
    padding: {
      none: 'p-0',
      default: 'p-4',
      spacious: 'p-4 pt-16',
    },
  },
  defaultVariants: {
    layer: 'viewport',
    align: 'center',
    tone: 'subtle',
    blur: 'sm',
    padding: 'default',
  },
});

export const overlaySurfaceVariants = cva(
  'relative w-full overflow-hidden border text-foreground',
  {
    variants: {
      tone: {
        card: 'border-border/70 bg-card shadow-ring',
        elevated: 'border-border/80 bg-background shadow-xl',
      },
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        full: 'max-w-none',
      },
      radius: {
        md: 'rounded-xl',
        lg: 'rounded-large',
        xl: 'rounded-[28px]',
      },
      padding: {
        compact: 'p-5',
        default: 'p-6',
        none: 'p-0',
      },
    },
    defaultVariants: {
      tone: 'card',
      size: 'md',
      radius: 'lg',
      padding: 'default',
    },
  }
);

export const sheetContentVariants = cva(
  'fixed z-50 flex flex-col border-border/70 bg-card text-foreground shadow-ring transition-transform duration-150 ease-out',
  {
    variants: {
      side: {
        top: 'left-0 right-0 top-0 border-b',
        bottom: 'bottom-0 left-0 right-0 border-t',
        left: 'inset-y-0 left-0 h-full w-[85vw] max-w-sm border-r',
        right: 'inset-y-0 right-0 h-full w-[85vw] max-w-sm border-l',
      },
      state: {
        open: 'translate-x-0 translate-y-0',
        closed: '',
      },
    },
    compoundVariants: [
      {
        side: 'top',
        state: 'closed',
        className: '-translate-y-full',
      },
      {
        side: 'bottom',
        state: 'closed',
        className: 'translate-y-full',
      },
      {
        side: 'left',
        state: 'closed',
        className: '-translate-x-full',
      },
      {
        side: 'right',
        state: 'closed',
        className: 'translate-x-full',
      },
    ],
    defaultVariants: {
      side: 'right',
      state: 'open',
    },
  }
);

export const overlayCloseButtonClassName =
  'rounded-small absolute right-4 top-4 p-2 text-muted-foreground transition-opacity hover:text-foreground hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
