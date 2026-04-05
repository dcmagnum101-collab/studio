import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: { value: number; label: string }
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'gold'
  icon?: React.ReactNode
  className?: string
}

const variantStyles = {
  default: {
    card: 'border-[#1a2332] bg-[#0D1421]',
    value: 'text-white',
    accent: 'bg-slate-500/10',
  },
  danger: {
    card: 'border-red-500/20 bg-red-500/5',
    value: 'text-red-400',
    accent: 'bg-red-500/10',
  },
  warning: {
    card: 'border-orange-500/20 bg-orange-500/5',
    value: 'text-orange-400',
    accent: 'bg-orange-500/10',
  },
  success: {
    card: 'border-emerald-500/20 bg-emerald-500/5',
    value: 'text-emerald-400',
    accent: 'bg-emerald-500/10',
  },
  gold: {
    card: 'border-[#C9A84C]/20 bg-[#C9A84C]/5',
    value: 'text-[#C9A84C]',
    accent: 'bg-[#C9A84C]/10',
  },
}

export function KpiCard({
  label,
  value,
  subtext,
  trend,
  variant = 'default',
  icon,
  className,
}: KpiCardProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        'relative rounded-lg border px-4 py-3 flex flex-col gap-1',
        styles.card,
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'absolute top-3 right-3 w-7 h-7 rounded flex items-center justify-center',
            styles.accent
          )}
        >
          <span className={cn('w-3.5 h-3.5', variant === 'gold' ? 'text-[#C9A84C]' : 'text-muted-foreground')}>
            {icon}
          </span>
        </div>
      )}

      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-none">
        {label}
      </p>

      <p className={cn('text-2xl font-bold font-data leading-none mt-0.5', styles.value)}>
        {value}
      </p>

      <div className="flex items-center gap-2 mt-0.5">
        {subtext && (
          <p className="text-[11px] text-slate-500">{subtext}</p>
        )}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-[11px] font-medium',
              trend.value > 0
                ? 'text-emerald-400'
                : trend.value < 0
                ? 'text-red-400'
                : 'text-slate-500'
            )}
          >
            {trend.value > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend.value < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}
