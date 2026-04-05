import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, addDays } from 'date-fns'
import { daysUntil, formatCurrency } from '@/lib/utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface NightlyReportData {
  date: string
  // Today's activity
  completedTasks: Array<{
    title: string
    caseNumber?: string
    caseId?: string
    completedBy: string
    category: string
  }>
  stageChanges: Array<{
    caseNumber: string
    title: string
    caseId: string
    fromStage: string
    toStage: string
    movedBy: string
  }>
  newDocuments: Array<{
    name: string
    caseNumber: string
    category: string
    uploadedBy: string
  }>
  timeEntries: {
    count: number
    totalHours: number
    billableHours: number
    dailyRevenue: number
    byCase: Array<{ caseNumber: string; hours: number; amount: number }>
  }
  auditActivity: {
    resolved: number
    newFlags: number
    criticalOpen: number
  }
  // Tomorrow's preview
  tomorrowDeadlines: Array<{
    title: string
    caseNumber?: string
    caseId?: string
    priority: string
    dueDate: string
    daysUntil: number
  }>
  solWarnings: Array<{
    caseNumber: string
    title: string
    caseId: string
    daysLeft: number
  }>
  // Totals
  activeCases: number
  openTasks: number
}

export async function gatherNightlyReportData(): Promise<NightlyReportData> {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const tomorrow = addDays(now, 1)
  const tomorrowEnd = endOfDay(tomorrow)
  const sol7 = addDays(now, 7)

  const [
    completedTasks,
    stageChanges,
    newDocs,
    timeEntries,
    resolvedFlags,
    newFlags,
    criticalFlags,
    tomorrowTasks,
    solCases,
    activeCaseCount,
    openTaskCount,
  ] = await Promise.all([
    // Tasks completed today
    prisma.task.findMany({
      where: { completedAt: { gte: todayStart, lte: todayEnd } },
      include: { case: true, assignedTo: true },
      orderBy: { completedAt: 'desc' },
    }),
    // Stage changes today
    prisma.stageHistory.findMany({
      where: { movedAt: { gte: todayStart, lte: todayEnd } },
      include: { case: true },
      orderBy: { movedAt: 'desc' },
    }),
    // New documents today
    prisma.document.findMany({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
      include: { case: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    // Time entries today
    prisma.timeEntry.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: { case: true },
    }),
    // Audit flags resolved today
    prisma.auditFlag.count({
      where: { resolvedAt: { gte: todayStart, lte: todayEnd } },
    }),
    // New audit flags today
    prisma.auditFlag.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    // Open critical flags
    prisma.auditFlag.count({
      where: { severity: 'CRITICAL', isResolved: false },
    }),
    // Tomorrow's tasks
    prisma.task.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { gte: startOfDay(tomorrow), lte: tomorrowEnd },
      },
      include: { case: true },
      orderBy: { priority: 'asc' },
      take: 10,
    }),
    // SOL < 7 days
    prisma.case.findMany({
      where: { status: 'ACTIVE', statute: { lte: sol7 } },
      orderBy: { statute: 'asc' },
    }),
    prisma.case.count({ where: { status: 'ACTIVE' } }),
    prisma.task.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
  ])

  // Aggregate time entries
  const totalHours = timeEntries.reduce((s, t) => s + t.hours, 0)
  const billableHours = timeEntries.filter(t => t.billable).reduce((s, t) => s + t.hours, 0)
  const dailyRevenue = timeEntries.filter(t => t.billable).reduce((s, t) => s + t.hours * t.rate, 0)

  // Group time by case
  const caseHours = new Map<string, { caseNumber: string; hours: number; amount: number }>()
  for (const entry of timeEntries.filter(t => t.billable)) {
    const key = entry.caseId
    const existing = caseHours.get(key) ?? {
      caseNumber: entry.case.caseNumber,
      hours: 0,
      amount: 0,
    }
    existing.hours += entry.hours
    existing.amount += entry.hours * entry.rate
    caseHours.set(key, existing)
  }

  return {
    date: now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Los_Angeles',
    }),
    completedTasks: completedTasks.map(t => ({
      title: t.title,
      caseNumber: t.case?.caseNumber,
      caseId: t.case?.id,
      completedBy: t.assignedTo.name,
      category: t.category,
    })),
    stageChanges: stageChanges.map(s => ({
      caseNumber: s.case.caseNumber,
      title: s.case.title,
      caseId: s.case.id,
      fromStage: s.fromStage ?? 'INTAKE',
      toStage: s.toStage,
      movedBy: s.movedBy,
    })),
    newDocuments: newDocs.map(d => ({
      name: d.name,
      caseNumber: d.case.caseNumber,
      category: d.category,
      uploadedBy: d.uploadedBy,
    })),
    timeEntries: {
      count: timeEntries.length,
      totalHours,
      billableHours,
      dailyRevenue,
      byCase: Array.from(caseHours.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    },
    auditActivity: {
      resolved: resolvedFlags,
      newFlags,
      criticalOpen: criticalFlags,
    },
    tomorrowDeadlines: tomorrowTasks.map(t => ({
      title: t.title,
      caseNumber: t.case?.caseNumber,
      caseId: t.case?.id,
      priority: t.priority,
      dueDate: t.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      daysUntil: daysUntil(t.dueDate),
    })),
    solWarnings: solCases.map(c => ({
      caseNumber: c.caseNumber,
      title: c.title,
      caseId: c.id,
      daysLeft: daysUntil(c.statute),
    })),
    activeCases: activeCaseCount,
    openTasks: openTaskCount,
  }
}

export async function generateNightlyNarrative(data: NightlyReportData): Promise<string> {
  const prompt = `You are the AI legal intelligence system for Paul Padda Law, a plaintiff personal injury firm in Las Vegas, NV.

Generate a concise end-of-day summary in 3-4 paragraphs for the attorney's nightly report.

Today (${data.date}) summary:
- Completed tasks: ${data.completedTasks.length}
- Stage changes: ${data.stageChanges.length} cases advanced
${data.stageChanges.map(s => `  * ${s.caseNumber}: ${s.fromStage} → ${s.toStage}`).join('\n')}
- New documents uploaded: ${data.newDocuments.length}
- Time tracked: ${data.timeEntries.totalHours.toFixed(1)}h total, ${data.timeEntries.billableHours.toFixed(1)}h billable
- Daily billable revenue: ${formatCurrency(data.timeEntries.dailyRevenue)}
- Audit flags resolved: ${data.auditActivity.resolved}, new flags: ${data.auditActivity.newFlags}
- Critical open flags: ${data.auditActivity.criticalOpen}

Tomorrow preview:
- Deadlines: ${data.tomorrowDeadlines.length} tasks due
- SOL warnings (<7 days): ${data.solWarnings.length}
${data.solWarnings.map(s => `  * ${s.caseNumber}: ${s.daysLeft} days left`).join('\n')}

Write a direct, action-oriented nightly summary. Highlight wins, flag concerns, and set up tomorrow's priorities.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  return (msg.content[0] as { text: string }).text
}
