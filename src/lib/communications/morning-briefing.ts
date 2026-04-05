import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { daysUntil } from '@/lib/utils'
import { addDays, startOfDay, endOfDay } from 'date-fns'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface MorningBriefingData {
  date: string
  activeCases: number
  criticalCases: Array<{ caseNumber: string; title: string; issue: string }>
  solWarnings: Array<{ caseNumber: string; title: string; daysLeft: number }>
  todayTasks: Array<{ title: string; caseNumber?: string; priority: string }>
  overdueTasks: Array<{ title: string; caseNumber?: string; daysOverdue: number }>
  stalledCases: Array<{ caseNumber: string; title: string; daysStalled: number }>
  highValuePipeline: number
  settledThisMonth: number
  newCasesThisWeek: number
}

export async function gatherMorningBriefingData(): Promise<MorningBriefingData> {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekAgo = addDays(now, -7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const sol30 = addDays(now, 30)

  const [activeCases, todayTasks, overdueTasks, solCases, settledMonth, newCasesWeek] =
    await Promise.all([
      prisma.case.findMany({
        where: { status: 'ACTIVE' },
        include: { client: true },
      }),
      prisma.task.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { gte: todayStart, lte: todayEnd },
        },
        include: { case: true },
        orderBy: { priority: 'asc' },
        take: 10,
      }),
      prisma.task.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: todayStart },
        },
        include: { case: true },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      prisma.case.findMany({
        where: {
          status: 'ACTIVE',
          statute: { lte: sol30 },
        },
      }),
      prisma.case.count({
        where: {
          status: 'SETTLED',
          dateClosed: { gte: monthStart },
        },
      }),
      prisma.case.count({
        where: {
          dateOpened: { gte: weekAgo },
        },
      }),
    ])

  const highValueTotal = activeCases
    .filter(c => (c.estimatedValue ?? 0) >= 100000)
    .reduce((sum, c) => sum + (c.estimatedValue ?? 0), 0)

  const solWarnings = solCases.map(c => ({
    caseNumber: c.caseNumber,
    title: c.title,
    daysLeft: daysUntil(c.statute),
  }))

  const stalledCases = activeCases
    .filter(c => {
      const daysInStage = Math.abs(daysUntil(c.stageEnteredAt))
      return daysInStage > 60
    })
    .map(c => ({
      caseNumber: c.caseNumber,
      title: c.title,
      daysStalled: Math.abs(daysUntil(c.stageEnteredAt)),
    }))
    .slice(0, 5)

  const criticalCases = activeCases
    .filter(c => c.priority === 'CRITICAL')
    .map(c => ({
      caseNumber: c.caseNumber,
      title: c.title,
      issue: `Priority: CRITICAL`,
    }))

  return {
    date: now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Los_Angeles',
    }),
    activeCases: activeCases.length,
    criticalCases,
    solWarnings,
    todayTasks: todayTasks.map(t => ({
      title: t.title,
      caseNumber: t.case?.caseNumber,
      priority: t.priority,
    })),
    overdueTasks: overdueTasks.map(t => ({
      title: t.title,
      caseNumber: t.case?.caseNumber,
      daysOverdue: Math.abs(daysUntil(t.dueDate)),
    })),
    stalledCases,
    highValuePipeline: highValueTotal,
    settledThisMonth: settledMonth,
    newCasesThisWeek: newCasesWeek,
  }
}

export async function generateBriefingNarrative(data: MorningBriefingData): Promise<string> {
  const prompt = `You are the AI legal intelligence system for Paul Padda Law, a plaintiff personal injury firm in Las Vegas, NV.

Today is ${data.date}. Generate a professional morning briefing in 4-6 concise paragraphs covering:
1. Overall firm health and pipeline summary
2. Critical SOL warnings and urgent deadlines
3. High-priority tasks for today
4. Cases requiring immediate attention
5. Strategic insights or recommendations

Data:
- Active cases: ${data.activeCases}
- New cases this week: ${data.newCasesThisWeek}
- Settled this month: ${data.settledThisMonth}
- High-value pipeline (>$100k cases): $${(data.highValuePipeline / 1000000).toFixed(2)}M
- SOL warnings (next 30 days): ${data.solWarnings.length} cases
${data.solWarnings.map(s => `  * ${s.caseNumber}: ${s.title} — ${s.daysLeft} days left`).join('\n')}
- Today's tasks: ${data.todayTasks.length}
- Overdue tasks: ${data.overdueTasks.length}
- Stalled cases (>60 days in stage): ${data.stalledCases.length}
${data.criticalCases.length > 0 ? `- CRITICAL priority cases: ${data.criticalCases.map(c => c.caseNumber).join(', ')}` : ''}

Write in a direct, attorney-focused tone. No fluff. Prioritize actionable information.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  return (msg.content[0] as { text: string }).text
}
