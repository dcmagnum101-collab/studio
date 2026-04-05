import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { ReportsClient } from './reports-client'
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Reports | Padda Legal Intelligence' }
export const dynamic = 'force-dynamic'

async function getReportData() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const qStart = startOfQuarter(now)
  const qEnd = endOfQuarter(now)
  const yStart = startOfYear(now)
  const yEnd = endOfYear(now)
  const lastMonth = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  const [
    activeCases,
    settledCases,
    casesByStage,
    casesByType,
    allTasks,
    timeEntriesMTD,
    timeEntriesQTD,
    timeEntriesYTD,
    invoices,
    auditRuns,
    integrationSyncs,
    stageHistoryAll,
  ] = await Promise.all([
    prisma.case.findMany({
      where: { status: 'ACTIVE' },
      include: {
        assignedTo: { select: { name: true } },
        stageHistory: { orderBy: { movedAt: 'asc' } },
      },
      orderBy: { statute: 'asc' },
    }),
    prisma.case.findMany({
      where: { status: 'SETTLED' },
      select: { id: true, caseNumber: true, title: true, settlementFinal: true, dateClosed: true, type: true },
      orderBy: { dateClosed: 'desc' },
    }),
    prisma.case.groupBy({ by: ['stage'], _count: { id: true }, where: { status: 'ACTIVE' } }),
    prisma.case.groupBy({ by: ['type'], _count: { id: true } }),
    prisma.task.findMany({
      include: { case: { select: { caseNumber: true } }, assignedTo: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.timeEntry.aggregate({
      where: { date: { gte: monthStart, lte: monthEnd }, billable: true },
      _sum: { hours: true },
    }),
    prisma.timeEntry.aggregate({
      where: { date: { gte: qStart, lte: qEnd }, billable: true },
      _sum: { hours: true },
    }),
    prisma.timeEntry.aggregate({
      where: { date: { gte: yStart, lte: yEnd }, billable: true },
      _sum: { hours: true },
    }),
    prisma.invoice.findMany({ orderBy: { issuedAt: 'desc' } }),
    prisma.auditRun.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.integrationSync.findMany({ orderBy: { syncedAt: 'desc' }, take: 50 }),
    prisma.stageHistory.findMany({
      where: { movedAt: { gte: subMonths(now, 6) } },
      include: { case: { select: { caseNumber: true, title: true, type: true } } },
      orderBy: { movedAt: 'desc' },
    }),
  ])

  // Revenue calculations
  const [mtdEntries, qtdEntries, ytdEntries] = await Promise.all([
    prisma.timeEntry.findMany({ where: { date: { gte: monthStart, lte: monthEnd }, billable: true } }),
    prisma.timeEntry.findMany({ where: { date: { gte: qStart, lte: qEnd }, billable: true } }),
    prisma.timeEntry.findMany({ where: { date: { gte: yStart, lte: yEnd }, billable: true } }),
  ])

  const revMTD = mtdEntries.reduce((s, e) => s + e.hours * e.rate, 0)
  const revQTD = qtdEntries.reduce((s, e) => s + e.hours * e.rate, 0)
  const revYTD = ytdEntries.reduce((s, e) => s + e.hours * e.rate, 0)

  // Attorney performance
  const attyMap = new Map<string, { name: string; cases: number; hours: number; revenue: number }>()
  for (const c of activeCases) {
    const existing = attyMap.get(c.assignedToId) ?? { name: c.assignedTo.name, cases: 0, hours: 0, revenue: 0 }
    existing.cases++
    attyMap.set(c.assignedToId, existing)
  }
  for (const e of ytdEntries) {
    const existing = attyMap.get(e.userId)
    if (existing) {
      existing.hours += e.hours
      existing.revenue += e.hours * e.rate
    }
  }

  // Stage conversion timing (avg days per stage from history)
  const stageTimings = new Map<string, number[]>()
  for (const sh of stageHistoryAll) {
    if (sh.fromStage) {
      const existing = stageTimings.get(sh.fromStage) ?? []
      existing.push(1) // simplified count
      stageTimings.set(sh.fromStage, existing)
    }
  }

  // SOL calendar data
  const solCases = activeCases
    .filter(c => c.statute)
    .map(c => ({
      id: c.id,
      caseNumber: c.caseNumber,
      title: c.title,
      statute: c.statute,
      stage: c.stage,
      assignedTo: c.assignedTo.name,
      type: c.type,
    }))
    .sort((a, b) => a.statute.getTime() - b.statute.getTime())

  return {
    revenue: { mtd: revMTD, qtd: revQTD, ytd: revYTD, hoursMTD: timeEntriesMTD._sum.hours ?? 0, hoursQTD: timeEntriesQTD._sum.hours ?? 0, hoursYTD: timeEntriesYTD._sum.hours ?? 0 },
    casesByStage,
    casesByType,
    activeCaseCount: activeCases.length,
    settledCases,
    tasks: allTasks,
    attorneys: Array.from(attyMap.values()),
    invoices,
    auditRuns,
    integrationSyncs,
    solCases,
    stageHistory: stageHistoryAll,
  }
}

export default async function ReportsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const data = await getReportData()
  return (
    <div className="flex flex-col h-full">
      <Topbar title="Reports" subtitle="Analytics, performance, and export" />
      <ReportsClient data={JSON.parse(JSON.stringify(data))} />
    </div>
  )
}
