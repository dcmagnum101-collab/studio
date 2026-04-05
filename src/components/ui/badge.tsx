import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/20 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        outline: 'text-foreground border-border',
        gold: 'border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]',
        danger: 'border-red-500/30 bg-red-500/10 text-red-400',
        warning: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
        success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        muted: 'border-slate-600/30 bg-slate-600/10 text-slate-500',
        purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
        cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
