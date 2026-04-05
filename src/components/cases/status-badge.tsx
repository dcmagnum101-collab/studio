import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'gold' | 'danger' | 'warning' | 'success' | 'info' | 'muted' | 'purple' | 'cyan'

interface StatusBadgeProps {
  value: string
  className?: string
}

const CASE_STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  INACTIVE: { label: 'Inactive', variant: 'muted' },
  SETTLED: { label: 'Settled', variant: 'purple' },
  CLOSED: { label: 'Closed', variant: 'muted' },
  REFERRED: { label: 'Referred', variant: 'cyan' },
  ARCHIVED: { label: 'Archived', variant: 'muted' },
}

const PIPELINE_STAGE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  INTAKE: { label: 'Intake', variant: 'info' },
  INVESTIGATION: { label: 'Investigation', variant: 'info' },
  DEMAND: { label: 'Demand', variant: 'gold' },
  NEGOTIATION: { label: 'Negotiation', variant: 'warning' },
  LITIGATION: { label: 'Litigation', variant: 'danger' },
  TRIAL: { label: 'Trial', variant: 'danger' },
  SETTLEMENT: { label: 'Settlement', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'muted' },
}

const PRIORITY_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  LOW: { label: 'Low', variant: 'muted' },
  MEDIUM: { label: 'Medium', variant: 'info' },
  HIGH: { label: 'High', variant: 'warning' },
  CRITICAL: { label: 'Critical', variant: 'danger' },
}

const TASK_STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Pending', variant: 'muted' },
  IN_PROGRESS: { label: 'In Progress', variant: 'info' },
  COMPLETED: { label: 'Done', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'muted' },
  BLOCKED: { label: 'Blocked', variant: 'danger' },
}

const SEVERITY_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  LOW: { label: 'Low', variant: 'muted' },
  MEDIUM: { label: 'Medium', variant: 'warning' },
  HIGH: { label: 'High', variant: 'danger' },
  CRITICAL: { label: 'Critical', variant: 'danger' },
}

function lookupBadge(
  value: string,
  maps: Record<string, Record<string, { label: string; variant: BadgeVariant }>>
): { label: string; variant: BadgeVariant } {
  for (const map of Object.values(maps)) {
    if (map[value]) return map[value]
  }
  return { label: value, variant: 'muted' }
}

export function CaseStatusBadge({ value, className }: StatusBadgeProps) {
  const config = CASE_STATUS_MAP[value] ?? { label: value, variant: 'muted' as BadgeVariant }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export function PipelineStageBadge({ value, className }: StatusBadgeProps) {
  const config = PIPELINE_STAGE_MAP[value] ?? { label: value, variant: 'muted' as BadgeVariant }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export function PriorityBadge({ value, className }: StatusBadgeProps) {
  const config = PRIORITY_MAP[value] ?? { label: value, variant: 'muted' as BadgeVariant }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export function TaskStatusBadge({ value, className }: StatusBadgeProps) {
  const config = TASK_STATUS_MAP[value] ?? { label: value, variant: 'muted' as BadgeVariant }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export function SeverityBadge({ value, className }: StatusBadgeProps) {
  const config = SEVERITY_MAP[value] ?? { label: value, variant: 'muted' as BadgeVariant }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

// Generic auto-detecting badge
export function StatusBadge({ value, className }: StatusBadgeProps) {
  const config = lookupBadge(value, {
    CASE_STATUS_MAP,
    PIPELINE_STAGE_MAP,
    PRIORITY_MAP,
    TASK_STATUS_MAP,
    SEVERITY_MAP,
  })
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
