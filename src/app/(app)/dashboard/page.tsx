import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { PipelineStageBadge, SeverityBadge } from '@/components/cases/status-badge'
import { SolCountdown } from '@/components/cases/sol-countdown'
import { Topbar } from '@/components/layout/topbar'
import { PipelineChart } from './pipeline-chart'
import {
  Briefcase,
  DollarSign,
  CheckSquare,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { formatCurrency, formatLA, daysUntil, STAGE_LABELS, CASE_TYPE_LABELS } from '@/lib/utils'
import { addDays, startOfMonth, endOfMonth } from 'date-fns'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDashboardData() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86400000 - 1)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const sol30 = addDays(now, 30)
  const sol60 = addDays(now, 60)

  const [
    activeCases,
    tasksDueToday,
    overdueTasks,
    solWarnings,
    settledThisMonth,
    recentFlags,
    pipelineStages,
    caseTypes,
    users,
  ] = await Promise.all([
    prisma.case.findMany({
      where: { status: 'ACTIVE' },
      select: { estimatedValue: true, status: true },
    }),
    prisma.task.count({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.task.count({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: todayStart },
      },
    }),
    prisma.case.findMany({
      where: { status: 'ACTIVE', statute: { lte: sol30 } },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        statute: true,
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { statute: 'asc' },
      take: 15,
    }),
    prisma.case.aggregate({
      where: {
        status: 'SETTLED',
        dateClosed: { gte: monthStart, lte: monthEnd },
      },
      _count: { _all: true },
      _sum: { settlementFinal: true },
    }),
    prisma.auditFlag.findMany({
      where: { isResolved: false },
      include: {
        case: { select: { caseNumber: true, title: true } },
      },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      take: 10,
    }),
    prisma.case.groupBy({
      by: ['stage'],
      where: { status: 'ACTIVE' },
      _count: { _all: true },
    }),
    prisma.case.groupBy({
      by: ['type'],
      where: { status: 'ACTIVE' },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        _count: { select: { assignedCases: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  const pipelineValue = activeCases.reduce((sum, c) => sum + (c.estimatedValue ?? 0), 0)
  const solWarningCount = solWarnings.filter(c => daysUntil(c.statute) < 30).length

  const sol60Cases = await prisma.case.findMany({
    where: { status: 'ACTIVE', statute: { lte: sol60 } },
    select: {
      id: true,
      caseNumber: true,
      title: true,
      statute: true,
      client: { select: { firstName: true, lastName: true } },
    },
    orderBy: { statute: 'asc' },
    take: 20,
  })

  return {
    activeCount: activeCases.length,
    pipelineValue,
    tasksDueToday,
    overdueTasks,
    solWarningCount,
    settledCount: settledThisMonth._count._all,
    settledValue: settledThisMonth._sum.settlementFinal ?? 0,
    solCases: sol60Cases,
    recentFlags,
    pipelineStages,
    caseTypes,
    users,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const data = await getDashboardData()

  const pipelineChartData = data.pipelineStages.map(row => ({
    stage: STAGE_LABELS[row.stage] ?? row.stage,
    count: row._count._all,
  }))

  const typeChartData = data.caseTypes.map(row => ({
    type: CASE_TYPE_LABELS[row.type] ?? row.type,
    count: row._count._all,
  }))

  return (
    <div className="p-4 space-y-4 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white">
            {formatLA(new Date(), 'EEEE, MMMM d, yyyy')}
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Welcome back, {session.user?.name?.split(' ')[0] ?? 'Counselor'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            Paul Padda Law · Las Vegas, NV
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
        <KpiCard
          label="Active Cases"
          value={data.activeCount}
          subtext="in pipeline"
          variant="default"
          icon={<Briefcase />}
        />
        <KpiCard
          label="Pipeline Value"
          value={
            data.pipelineValue >= 1_000_000
              ? `$${(data.pipelineValue / 1_000_000).toFixed(1)}M`
              : formatCurrency(data.pipelineValue)
          }
          subtext="estimated"
          variant="gold"
          icon={<DollarSign />}
        />
        <KpiCard
          label="Tasks Due Today"
          value={data.tasksDueToday}
          subtext="pending"
          variant={data.tasksDueToday > 0 ? 'warning' : 'default'}
          icon={<CheckSquare />}
        />
        <KpiCard
          label="SOL Warnings"
          value={data.solWarningCount}
          subtext="< 30 days"
          variant={data.solWarningCount > 0 ? 'danger' : 'default'}
          icon={<AlertTriangle />}
        />
        <KpiCard
          label="Overdue Tasks"
          value={data.overdueTasks}
          subtext="need attention"
          variant={data.overdueTasks > 0 ? 'danger' : 'default'}
          icon={<Clock />}
        />
        <KpiCard
          label="Settled This Month"
          value={data.settledCount}
          subtext={
            data.settledValue > 0
              ? formatCurrency(data.settledValue)
              : 'no settlements'
          }
          variant="success"
          icon={<TrendingUp />}
        />
      </div>

      {/* Main Grid: Pipeline Chart + SOL Tracker */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Pipeline Bar Chart */}
        <div className="xl:col-span-3 bg-[#0D1421] border border-[#1a2332] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              Pipeline by Stage
            </h2>
            <span className="text-[10px] text-slate-500">Active cases</span>
          </div>
          <PipelineChart data={pipelineChartData} />
        </div>

        {/* SOL Tracker */}
        <div className="xl:col-span-2 bg-[#0D1421] border border-[#1a2332] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              SOL Tracker
            </h2>
            <span className="text-[10px] text-slate-500">Next 60 days</span>
          </div>
          {data.solCases.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No SOL warnings in 60 days</p>
          ) : (
            <div className="space-y-1 overflow-y-auto max-h-64">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 items-center pb-1 mb-1 border-b border-[#1a2332]">
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">Case #</span>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">Title</span>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">SOL Date</span>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">Days</span>
              </div>
              {data.solCases.map(c => {
                const days = daysUntil(c.statute)
                return (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 items-center py-1 hover:bg-white/[0.02] rounded transition-colors group"
                  >
                    <span className="text-[11px] font-data text-[#C9A84C] group-hover:underline">
                      {c.caseNumber}
                    </span>
                    <span className="text-[11px] text-slate-300 truncate">{c.title}</span>
                    <span className="text-[11px] font-data text-slate-500">
                      {formatLA(c.statute, 'MM/dd/yy')}
                    </span>
                    <SolCountdown statute={c.statute} showIcon={false} />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Activity Feed + Quick Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Audit Flags */}
        <div className="xl:col-span-2 bg-[#0D1421] border border-[#1a2332] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#C9A84C]" />
              Unresolved Audit Flags
            </h2>
            <Link
              href="/audit"
              className="text-[11px] text-[#C9A84C] hover:underline"
            >
              View all
            </Link>
          </div>
          {data.recentFlags.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No unresolved flags — all clear
            </p>
          ) : (
            <div className="space-y-1.5">
              {data.recentFlags.map(flag => (
                <div
                  key={flag.id}
                  className="flex items-start gap-2.5 py-1.5 border-b border-[#111827] last:border-0"
                >
                  <SeverityBadge value={flag.severity} className="shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-white font-medium leading-tight">
                      {flag.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <Link
                        href={`/cases/${flag.caseId}`}
                        className="text-[#C9A84C] hover:underline font-data"
                      >
                        {flag.case.caseNumber}
                      </Link>{' '}
                      · {flag.case.title}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0 font-data">
                    {formatLA(flag.createdAt, 'MM/dd')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          {/* Cases by Type */}
          <div className="bg-[#0D1421] border border-[#1a2332] rounded-lg p-4">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Cases by Type
            </h2>
            <div className="space-y-1.5">
              {typeChartData.sort((a, b) => b.count - a.count).slice(0, 6).map(item => {
                const maxCount = Math.max(...typeChartData.map(d => d.count))
                const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                return (
                  <div key={item.type} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 w-32 truncate shrink-0">
                      {item.type}
                    </span>
                    <div className="flex-1 h-1.5 bg-[#111827] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C9A84C]/60 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-data text-slate-500 w-4 text-right">
                      {item.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Attorneys */}
          <div className="bg-[#0D1421] border border-[#1a2332] rounded-lg p-4">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Attorneys by Caseload
            </h2>
            <div className="space-y-2">
              {data.users
                .filter(u => u.role === 'ATTORNEY' || u.role === 'ADMIN')
                .sort((a, b) => b._count.assignedCases - a._count.assignedCases)
                .slice(0, 5)
                .map(u => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-[#C9A84C]/10 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[#C9A84C]">
                          {u.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300 truncate max-w-[100px]">
                        {u.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-data text-slate-500">
                      {u._count.assignedCases} cases
                    </span>
                  </div>
                ))}
              {data.users.filter(u => u.role === 'ATTORNEY' || u.role === 'ADMIN').length === 0 && (
                <p className="text-[11px] text-slate-600">No attorneys found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
