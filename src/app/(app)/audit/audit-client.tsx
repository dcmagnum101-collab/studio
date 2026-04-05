'use client'

import { useState } from 'react'
import { cn, SEVERITY_COLORS, formatLA } from '@/lib/utils'
import {
  Brain,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

interface AuditRun {
  id: string
  type: string
  casesScanned: number
  flagsFound: number
  riskScore: number
  createdAt: string
  completedAt: string | null
  user: { name: string }
  _count: { flags: number }
}

interface AuditFlag {
  id: string
  type: string
  severity: string
  title: string
  description: string
  recommendation: string
  urgency: string
  isResolved: boolean
  createdAt: string
  case: { id: string; caseNumber: string; title: string }
}

interface AuditPageClientProps {
  recentRuns: AuditRun[]
  unresolvedFlags: AuditFlag[]
  criticalCount: number
  highCount: number
  userId: string
}

const FLAG_TYPE_ICONS: Record<string, string> = {
  SOL_WARNING: '⏰',
  STALLED: '🔄',
  OVERDUE_TASK: '📋',
  MISSING_DOC: '📄',
  BOTTLENECK: '🚧',
  UNDERVALUED: '💰',
  NO_ACTIVITY: '😴',
}

function RiskMeter({ score }: { score: number }) {
  const color = score >= 70 ? '#DC2626' : score >= 40 ? '#D97706' : score >= 20 ? '#CA8A04' : '#16A34A'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-data font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  )
}

export function AuditPageClient({
  recentRuns,
  unresolvedFlags,
  criticalCount,
  highCount,
  userId,
}: AuditPageClientProps) {
  const [running, setRunning] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [localFlags, setLocalFlags] = useState(unresolvedFlags)
  const [activeFilter, setActiveFilter] = useState<string>('ALL')

  const [streamProgress, setStreamProgress] = useState<{ processed: number; total: number; current?: string } | null>(null)

  async function runAudit() {
    setRunning(true)
    setStreamProgress({ processed: 0, total: 0 })
    try {
      const res = await fetch('/api/audit/run-all', { method: 'POST' })
      if (!res.body) { window.location.reload(); return }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'progress') {
              setStreamProgress({ processed: data.processed, total: data.total, current: data.caseNumber })
            } else if (data.type === 'complete') {
              window.location.reload()
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } finally {
      setRunning(false)
      setStreamProgress(null)
    }
  }

  async function resolveFlag(flagId: string) {
    setResolving(flagId)
    try {
      const res = await fetch(`/api/audit/flags/${flagId}/resolve`, { method: 'POST' })
      if (res.ok) {
        setLocalFlags(prev => prev.filter(f => f.id !== flagId))
      }
    } finally {
      setResolving(null)
    }
  }

  const filtered =
    activeFilter === 'ALL'
      ? localFlags
      : localFlags.filter(f => f.severity === activeFilter)

  const groupedBySeverity = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].reduce(
    (acc, sev) => {
      acc[sev] = filtered.filter(f => f.severity === sev)
      return acc
    },
    {} as Record<string, AuditFlag[]>
  )

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Unresolved Flags',
            value: localFlags.length,
            icon: <AlertTriangle className="w-4 h-4" />,
            color: localFlags.length > 0 ? 'text-red-400' : 'text-emerald-400',
          },
          {
            label: 'Critical',
            value: criticalCount,
            icon: <Shield className="w-4 h-4" />,
            color: criticalCount > 0 ? 'text-red-400' : 'text-muted-foreground',
          },
          {
            label: 'High',
            value: highCount,
            icon: <AlertTriangle className="w-4 h-4" />,
            color: highCount > 0 ? 'text-orange-400' : 'text-muted-foreground',
          },
          {
            label: 'Audit Runs',
            value: recentRuns.length,
            icon: <Brain className="w-4 h-4" />,
            color: 'text-muted-foreground',
          },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded p-3">
            <div className={cn('flex items-center gap-1.5 mb-1', stat.color)}>
              {stat.icon}
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className={cn('text-2xl font-data font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Flags */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-medium transition-all',
                    activeFilter === f
                      ? 'bg-gold/10 text-gold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={runAudit}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-navy text-xs font-bold rounded hover:bg-gold/90 transition-all disabled:opacity-50"
            >
              {running ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {running && streamProgress
                ? `${streamProgress.processed}/${streamProgress.total}${streamProgress.current ? ` · ${streamProgress.current}` : ''}`
                : running ? 'Starting...' : 'Run Full Audit'}
            </button>
          </div>

          {localFlags.length === 0 ? (
            <div className="bg-card border border-border rounded p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">All clear — no unresolved flags</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run a new audit to check for issues.
              </p>
            </div>
          ) : (
            ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => {
              const flags = groupedBySeverity[severity]
              if (!flags || flags.length === 0) return null
              return (
                <div key={severity}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    {severity} ({flags.length})
                  </p>
                  <div className="space-y-2">
                    {flags.map(flag => (
                      <div
                        key={flag.id}
                        className={cn(
                          'bg-card rounded border p-3 group',
                          SEVERITY_COLORS[flag.severity]
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{FLAG_TYPE_ICONS[flag.type] ?? '🚩'}</span>
                              <Link
                                href={`/cases/${flag.case.id}`}
                                className="text-[11px] font-data text-muted-foreground hover:text-gold transition-colors"
                              >
                                {flag.case.caseNumber}
                              </Link>
                              <span
                                className={cn(
                                  'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                                  SEVERITY_COLORS[flag.severity]
                                )}
                              >
                                {flag.type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">{flag.title}</p>
                            <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">{flag.description}</p>
                            <div className="mt-2 p-2 bg-muted/30 rounded text-[11px] text-emerald-400">
                              <span className="font-bold">→ </span>{flag.recommendation}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <Link
                              href={`/cases/${flag.case.id}`}
                              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                              Open <ChevronRight className="w-3 h-3" />
                            </Link>
                            <button
                              onClick={() => resolveFlag(flag.id)}
                              disabled={resolving === flag.id}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              {resolving === flag.id ? '...' : 'Resolve'}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-data">
                            {formatLA(flag.createdAt, 'MMM d, h:mm a')}
                          </span>
                          <span className={cn('text-[10px] font-bold ml-auto', SEVERITY_COLORS[flag.severity])}>
                            {flag.urgency.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Recent Runs sidebar */}
        <div className="w-64 shrink-0 space-y-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Audit History
          </p>
          {recentRuns.length === 0 ? (
            <p className="text-xs text-muted-foreground">No audit runs yet.</p>
          ) : (
            recentRuns.map(run => (
              <div key={run.id} className="bg-card border border-border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {run.type}
                  </span>
                  <span className="text-[10px] font-data text-muted-foreground">
                    {formatLA(run.createdAt, 'MMM d')}
                  </span>
                </div>
                <RiskMeter score={Math.round(run.riskScore)} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{run.casesScanned} cases</span>
                  <span className={run.flagsFound > 0 ? 'text-orange-400' : 'text-emerald-400'}>
                    {run.flagsFound} flags
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  by {run.user.name}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
