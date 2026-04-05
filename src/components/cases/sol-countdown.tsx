import { cn, daysUntil } from '@/lib/utils'
import { AlertTriangle, Clock } from 'lucide-react'

interface SolCountdownProps {
  statute: Date | string
  showIcon?: boolean
  className?: string
}

export function SolCountdown({ statute, showIcon = true, className }: SolCountdownProps) {
  const days = daysUntil(statute)

  const urgency =
    days <= 7
      ? 'critical'
      : days <= 30
      ? 'high'
      : days <= 90
      ? 'medium'
      : 'low'

  const colorMap = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-slate-400',
  }

  const bgMap = {
    critical: 'bg-red-500/10 border-red-500/20',
    high: 'bg-orange-500/10 border-orange-500/20',
    medium: 'bg-yellow-500/10 border-yellow-500/20',
    low: 'bg-transparent border-slate-600/20',
  }

  const color = colorMap[urgency]
  const bg = bgMap[urgency]

  if (days < 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-data text-red-500', className)}>
        <AlertTriangle className="w-3 h-3" />
        EXPIRED
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-data font-medium px-2 py-0.5 rounded border',
        color,
        bg,
        className
      )}
    >
      {showIcon && urgency !== 'low' ? (
        <AlertTriangle className="w-3 h-3 shrink-0" />
      ) : showIcon ? (
        <Clock className="w-3 h-3 shrink-0" />
      ) : null}
      {days}d
    </span>
  )
}
