import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground',
        'flex field-sizing-content min-h-20 w-full rounded-lg border border-border/50 bg-secondary/30 px-3 py-2.5 text-base transition-all duration-200 outline-none',
        'hover:border-border hover:bg-secondary/50',
        'focus:border-primary focus:bg-secondary/50 focus:ring-2 focus:ring-primary/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'md:text-sm',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
