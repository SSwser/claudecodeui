import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const badgeVariants = cva(
  'rounded-small inline-flex items-center border px-2.5 py-1 text-sm font-medium tracking-body transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
  {
    variants: {
      variant: {
        default: 'border-border/60 bg-surface-2 text-foreground shadow-subtle',
        secondary: 'border-border/60 bg-background text-muted-foreground shadow-subtle',
        destructive: 'border-destructive/35 bg-destructive/10 text-destructive shadow-subtle',
        outline: 'border-border/70 bg-transparent text-foreground',
        success: 'border-success/30 bg-success/10 text-success shadow-subtle',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
