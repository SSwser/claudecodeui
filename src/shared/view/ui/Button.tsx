import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

// Keep visual variants centralized so all button usages stay consistent.
const buttonVariants = cva(
  'inline-flex touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-medium border border-transparent text-sm font-semibold tracking-ui text-foreground shadow-subtle transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'rounded-pill border-border/60 bg-card/80 text-foreground shadow-button hover:opacity-60',
        destructive:
          'rounded-pill border-destructive/35 bg-destructive/10 text-destructive shadow-subtle hover:opacity-60',
        outline:
          'rounded-small border-border/80 bg-surface-2/70 text-foreground shadow-subtle hover:opacity-60',
        secondary:
          'rounded-small border-border/70 bg-transparent text-foreground shadow-subtle hover:opacity-60',
        ghost:
          'rounded-pill border-transparent bg-transparent text-muted-foreground shadow-none hover:text-foreground hover:opacity-60',
        surface:
          'rounded-large border-border/70 bg-surface-2 text-foreground shadow-ring hover:opacity-60',
        link: 'h-auto rounded-none border-transparent bg-transparent p-0 text-ring underline-offset-4 shadow-none hover:underline hover:opacity-60',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
