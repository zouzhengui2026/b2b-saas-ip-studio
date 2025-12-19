import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/90 text-primary-foreground shadow-sm [a&]:hover:bg-primary',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive/80 text-white shadow-sm [a&]:hover:bg-destructive',
        outline:
          'border-border/50 bg-secondary/30 text-foreground [a&]:hover:bg-secondary [a&]:hover:border-border',
        success:
          'border-transparent bg-emerald-500/20 text-emerald-400 [a&]:hover:bg-emerald-500/30',
        warning:
          'border-transparent bg-amber-500/20 text-amber-400 [a&]:hover:bg-amber-500/30',
        info:
          'border-transparent bg-blue-500/20 text-blue-400 [a&]:hover:bg-blue-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
