'use client'

import { useState } from 'react'
import { cn, formatCurrency, formatHours, formatLA, daysUntil, STAGE_LABELS, CASE_TYPE_LABELS, SEVERITY_COLORS } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { FileDown, TrendingUp, Users, Calendar, Scale, Brain, Zap, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const GOLD = '#C9A84C'
const CHART_COLORS = ['#C9A84C', '#2563EB', '#16A34A', '#DC2626', '#7C3AED', '#D97706', '#06B6D4', '#EC4899']

const REPORT_TABS = [
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'aging', label: 'Case Aging', icon: Scale },
  { id: 'sol', label: 'SOL Calendar', icon: Calendar },
  { id: 'attorneys', label: 'Attorney Performance', icon: Users },
  { id: 'audit', label: 'Audit Summary', icon: Brain },
  { id: 'stages', label: 'Stage Conversion', icon: TrendingUp },
  { id: 'integrations', label: 'Integration Logs', icon: Zap },
] as const

type ReportTab = (typeof REPORT_TABS)[number]['id']

interface ReportsClientProps {
  data: {
    revenue: { mtd: number; qtd: number; ytd: number; hoursMTD: number; hoursQTD: number; hoursYTD: number }
    casesByStage: Array<{ stage: string; _count: { id: number } }>
    casesByType: Array<{ type: string; _count: { id: number } }>
    activeCaseCount: number
    settledCases: Array<{ id: string; caseNumber: string; title: string; settlementFinal: number | null; dateClosed: string | null; type: string }>
    tasks: Array<{ id: string; title: string; status: string; dueDate: string; priority: string; case: { caseNumber: string } | null; assignedTo: { name: string } }>
    attorneys: Array<{ name: string; cases: number; hours: number; revenue: number }>
    invoices: Array<{ id: string; amount: number; status: string; issuedAt: string; dueDate: string }>
    auditRuns: Array<{ id: string; type: string; casesScanned: number; flagsFound: number; riskScore: number; createdAt: string }>
    integrationSyncs: Array<{ id: string; system: string; status: string; message: string | null; records: number; syncedAt: string }>
    solCases: Array<{ id: string; caseNumber: string; title: string; statute: string; stage: string; assignedTo: string; type: string }>
    stageHistory: Array<{ id: string; fromStage: string | null; toStage: string; movedAt: string; case: { caseNumber: string; title: string; type: string } }>
  }
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded p-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-data font-bold text-gold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{title}</h3>
}

export function ReportsClient({ data }: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue')

  const stageChartData = data.casesByStage.map(s => ({
    name: STAGE_LABELS[s.stage] ?? s.stage,
    cases: s._count.id,
  }))

  const typeChartData = data.casesByType.map(t => ({
    name: (CASE_TYPE_LABELS[t.type] ?? t.type).replace(' ', '\n'),
    value: t._count.id,
  }))

  const overdueTasks = data.tasks.filter(t =>
    t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date()
  )

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-0">
        {REPORT_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-all -mb-px',
              activeTab === tab.id
                ? 'border-gold text-gold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── REVENUE ───────────────────────────────────────────── */}
      {activeTab === 'revenue' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Revenue MTD" value={formatCurrency(data.revenue.mtd)} sub={`${formatHours(data.revenue.hoursMTD)} billed`} />
            <StatCard label="Revenue QTD" value={formatCurrency(data.revenue.qtd)} sub={`${formatHours(data.revenue.hoursQTD)} billed`} />
            <StatCard label="Revenue YTD" value={formatCurrency(data.revenue.ytd)} sub={`${formatHours(data.revenue.hoursYTD)} billed`} />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-card border border-border rounded p-4">
              <SectionHeader title="Cases by Stage" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stageChartData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#9CA3AF' }} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: 4, fontSize: 12 }} />
                  <Bar dataKey="cases" fill={GOLD} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded p-4">
              <SectionHeader title="Cases by Type" />
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={typeChartData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {typeChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: 4, fontSize: 12 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <SectionHeader title="Invoice Status" />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Issued', 'Amount', 'Status', 'Due Date'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.invoices.slice(0, 15).map((inv, i) => (
                  <tr key={inv.id} className={cn('border-b border-border/50 hover:bg-muted/20', i % 2 === 0 ? '' : 'bg-muted/10')}>
                    <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">{formatLA(inv.issuedAt, 'MMM d, yyyy')}</td>
                    <td className="px-3 py-2 text-[12px] font-data font-bold text-foreground">{formatCurrency(inv.amount)}</td>
                    <td className="px-3 py-2">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', inv.status === 'PAID' ? 'text-emerald-400 bg-emerald-400/10' : inv.status === 'OVERDUE' ? 'text-red-400 bg-red-400/10' : 'text-blue-400 bg-blue-400/10')}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">{formatLA(inv.dueDate, 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CASE AGING ────────────────────────────────────────── */}
      {activeTab === 'aging' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Active Cases" value={String(data.activeCaseCount)} />
            <StatCard label="Overdue Tasks" value={String(overdueTasks.length)} />
            <StatCard label="Settled Total" value={String(data.settledCases.length)} />
          </div>
          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Case #', 'Stage', 'SOL', 'Days to SOL', 'Assigned To'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.solCases.map((c, i) => {
                  const days = daysUntil(c.statute)
                  const color = days <= 7 ? 'text-red-400' : days <= 30 ? 'text-orange-400' : days <= 90 ? 'text-yellow-400' : 'text-muted-foreground'
                  return (
                    <tr key={c.id} className={cn('border-b border-border/50 hover:bg-muted/20', i % 2 === 0 ? '' : 'bg-muted/10')}>
                      <td className="px-3 py-2">
                        <Link href={`/cases/${c.id}`} className="text-[12px] text-gold hover:text-gold/80 font-data">{c.caseNumber}</Link>
                      </td>
                      <td className="px-3 py-2 text-[12px] text-muted-foreground">{STAGE_LABELS[c.stage] ?? c.stage}</td>
                      <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">{formatLA(c.statute, 'MMM d, yyyy')}</td>
                      <td className={cn('px-3 py-2 text-[12px] font-data font-bold', color)}>{days}d</td>
                      <td className="px-3 py-2 text-[12px] text-muted-foreground">{c.assignedTo}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SOL CALENDAR ──────────────────────────────────────── */}
      {activeTab === 'sol' && (
        <div className="space-y-3">
          <SectionHeader title={`${data.solCases.length} Active Cases — SOL Timeline`} />
          <div className="space-y-2">
            {['<7 days', '8-30 days', '31-90 days', '90+ days'].map(range => {
              const [min, max] = range === '<7 days' ? [0, 7] : range === '8-30 days' ? [8, 30] : range === '31-90 days' ? [31, 90] : [91, Infinity]
              const color = range === '<7 days' ? 'border-red-500/40 bg-red-500/5' : range === '8-30 days' ? 'border-orange-500/40 bg-orange-500/5' : range === '31-90 days' ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-border bg-card'
              const labelColor = range === '<7 days' ? 'text-red-400' : range === '8-30 days' ? 'text-orange-400' : range === '31-90 days' ? 'text-yellow-400' : 'text-muted-foreground'
              const cases = data.solCases.filter(c => { const d = daysUntil(c.statute); return d >= min && d <= max })
              if (cases.length === 0) return null
              return (
                <div key={range} className={cn('rounded border p-3', color)}>
                  <p className={cn('text-[11px] font-bold uppercase tracking-widest mb-2', labelColor)}>{range} ({cases.length})</p>
                  <div className="grid grid-cols-2 gap-1">
                    {cases.map(c => (
                      <div key={c.id} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                        <Link href={`/cases/${c.id}`} className="text-[12px] text-foreground hover:text-gold transition-colors truncate mr-2">
                          {c.caseNumber} — {c.title.substring(0, 30)}
                        </Link>
                        <span className={cn('text-[11px] font-data font-bold shrink-0', labelColor)}>
                          {formatLA(c.statute, 'MMM d')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ATTORNEY PERFORMANCE ──────────────────────────────── */}
      {activeTab === 'attorneys' && (
        <div className="space-y-4">
          <SectionHeader title="YTD Performance by Attorney" />
          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Attorney', 'Active Cases', 'Hours YTD', 'Revenue YTD'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.attorneys.sort((a, b) => b.revenue - a.revenue).map((atty, i) => (
                  <tr key={atty.name} className={cn('border-b border-border/50 hover:bg-muted/20', i % 2 === 0 ? '' : 'bg-muted/10')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center text-[11px] font-bold text-gold">
                          {atty.name.charAt(0)}
                        </div>
                        <span className="text-[13px] font-medium text-foreground">{atty.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[14px] font-data font-bold text-foreground">{atty.cases}</td>
                    <td className="px-4 py-3 text-[14px] font-data text-foreground">{formatHours(atty.hours)}</td>
                    <td className="px-4 py-3 text-[14px] font-data font-bold text-gold">{formatCurrency(atty.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AUDIT SUMMARY ─────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <SectionHeader title="Audit Run History" />
          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Date', 'Type', 'Cases', 'Flags', 'Avg Risk', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.auditRuns.map((run, i) => {
                  const riskColor = run.riskScore >= 70 ? 'text-red-400' : run.riskScore >= 40 ? 'text-orange-400' : run.riskScore >= 20 ? 'text-yellow-400' : 'text-emerald-400'
                  return (
                    <tr key={run.id} className={cn('border-b border-border/50 hover:bg-muted/20', i % 2 === 0 ? '' : 'bg-muted/10')}>
                      <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">{formatLA(run.createdAt, 'MMM d, h:mm a')}</td>
                      <td className="px-3 py-2"><span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{run.type}</span></td>
                      <td className="px-3 py-2 text-[12px] font-data text-foreground">{run.casesScanned}</td>
                      <td className="px-3 py-2 text-[12px] font-data font-bold text-foreground">{run.flagsFound}</td>
                      <td className={cn('px-3 py-2 text-[12px] font-data font-bold', riskColor)}>{Math.round(run.riskScore)}</td>
                      <td className="px-3 py-2"><span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Complete</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STAGE CONVERSION ──────────────────────────────────── */}
      {activeTab === 'stages' && (
        <div className="space-y-4">
          <SectionHeader title="Recent Stage Movements (Last 6 Months)" />
          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Date', 'Case', 'From', 'To'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.stageHistory.slice(0, 50).map((sh, i) => (
                  <tr key={sh.id} className={cn('border-b border-border/50 hover:bg-muted/20', i % 2 === 0 ? '' : 'bg-muted/10')}>
                    <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">{formatLA(sh.movedAt, 'MMM d')}</td>
                    <td className="px-3 py-2 text-[12px] font-data text-gold">{sh.case.caseNumber}</td>
                    <td className="px-3 py-2 text-[12px] text-muted-foreground">{sh.fromStage ? STAGE_LABELS[sh.fromStage] : '—'}</td>
                    <td className="px-3 py-2 text-[12px] text-emerald-400 font-medium">{STAGE_LABELS[sh.toStage] ?? sh.toStage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── INTEGRATION LOGS ──────────────────────────────────── */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <SectionHeader title="Integration Sync Logs" />
          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['System', 'Status', 'Records', 'Message', 'Time'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.integrationSyncs.map((s, i) => (
                  <tr key={s.id} className={cn('border-b border-border/50 hover:bg-muted/20', i % 2 === 0 ? '' : 'bg-muted/10')}>
                    <td className="px-3 py-2 text-[12px] font-medium text-foreground capitalize">{s.system}</td>
                    <td className="px-3 py-2"><span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', s.status === 'success' ? 'text-emerald-400 bg-emerald-400/10' : s.status === 'failed' ? 'text-red-400 bg-red-400/10' : 'text-orange-400 bg-orange-400/10')}>{s.status}</span></td>
                    <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">{s.records}</td>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground truncate max-w-[200px]">{s.message ?? '—'}</td>
                    <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">{formatLA(s.syncedAt, 'MMM d, h:mm a')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
