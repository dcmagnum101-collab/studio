import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { daysUntil } from '@/lib/utils'
import type { Case, Task, AuditFlag } from '@prisma/client'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CaseAuditData {
  id: string
  caseNumber: string
  title: string
  status: string
  stage: string
  priority: string
  incidentDate: Date
  statute: Date
  estimatedValue: number | null
  stageEnteredAt: Date
  lastActivity?: Date
  taskCount: number
  overdueTaskCount: number
  documentCount: number
  noteCount: number
}

export async function auditCase(caseData: CaseAuditData, userId: string) {
  const daysInStage = daysUntil(caseData.stageEnteredAt) * -1
  const solDays = daysUntil(caseData.statute)
  const flags: Array<Omit<AuditFlag, 'id' | 'createdAt' | 'resolvedAt' | 'resolvedBy'>> = []

  // SOL check
  if (solDays <= 30 && caseData.status === 'ACTIVE') {
    flags.push({
      caseId: caseData.id,
      runId: '', // filled after run creation
      type: 'SOL_WARNING',
      severity: solDays <= 7 ? 'CRITICAL' : solDays <= 14 ? 'HIGH' : 'MEDIUM',
      title: `SOL expires in ${solDays} days`,
      description: `Statute of limitations for case ${caseData.caseNumber} expires on ${caseData.statute.toLocaleDateString()}. Immediate action required.`,
      recommendation: solDays <= 7
        ? 'File immediately or obtain tolling agreement. Contact client ASAP.'
        : 'Prepare demand letter and ensure all evidence is documented.',
      urgency: solDays <= 7 ? 'IMMEDIATE' : 'THIS_WEEK',
      isResolved: false,
    })
  }

  // Stalled case check
  if (daysInStage > 90 && caseData.status === 'ACTIVE') {
    flags.push({
      caseId: caseData.id,
      runId: '',
      type: 'STALLED',
      severity: daysInStage > 180 ? 'HIGH' : 'MEDIUM',
      title: `Case stalled in ${caseData.stage} for ${daysInStage} days`,
      description: `Case ${caseData.caseNumber} has been in ${caseData.stage} stage for ${daysInStage} days without progression.`,
      recommendation: 'Review case status, contact client, and create action plan to advance.',
      urgency: 'THIS_WEEK',
      isResolved: false,
    })
  }

  // Overdue tasks
  if (caseData.overdueTaskCount > 0) {
    flags.push({
      caseId: caseData.id,
      runId: '',
      type: 'OVERDUE_TASK',
      severity: caseData.overdueTaskCount >= 3 ? 'HIGH' : 'MEDIUM',
      title: `${caseData.overdueTaskCount} overdue task${caseData.overdueTaskCount > 1 ? 's' : ''}`,
      description: `Case ${caseData.caseNumber} has ${caseData.overdueTaskCount} overdue tasks that need attention.`,
      recommendation: 'Review and complete or reassign overdue tasks immediately.',
      urgency: 'IMMEDIATE',
      isResolved: false,
    })
  }

  // Missing documents
  if (caseData.documentCount === 0 && caseData.stage !== 'INTAKE') {
    flags.push({
      caseId: caseData.id,
      runId: '',
      type: 'MISSING_DOC',
      severity: 'MEDIUM',
      title: 'No documents uploaded',
      description: `Case ${caseData.caseNumber} in ${caseData.stage} stage has no documents uploaded.`,
      recommendation: 'Upload police report, medical records, or other relevant documents.',
      urgency: 'THIS_WEEK',
      isResolved: false,
    })
  }

  return flags
}

export async function runFullAudit(userId: string, type: 'SCHEDULED' | 'MANUAL' = 'MANUAL') {
  const activeCases = await prisma.case.findMany({
    where: { status: 'ACTIVE' },
    include: {
      tasks: true,
      documents: true,
      notes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  const allFlags: Omit<AuditFlag, 'id' | 'createdAt' | 'resolvedAt' | 'resolvedBy'>[] = []

  for (const c of activeCases) {
    const overdueCount = c.tasks.filter(
      t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.dueDate < new Date()
    ).length

    const caseData: CaseAuditData = {
      id: c.id,
      caseNumber: c.caseNumber,
      title: c.title,
      status: c.status,
      stage: c.stage,
      priority: c.priority,
      incidentDate: c.incidentDate,
      statute: c.statute,
      estimatedValue: c.estimatedValue,
      stageEnteredAt: c.stageEnteredAt,
      lastActivity: c.notes[0]?.createdAt,
      taskCount: c.tasks.length,
      overdueTaskCount: overdueCount,
      documentCount: c.documents.length,
      noteCount: c.notes.length,
    }

    const flags = await auditCase(caseData, userId)
    allFlags.push(...flags)
  }

  // Create audit run record
  const run = await prisma.auditRun.create({
    data: {
      triggeredBy: userId,
      type,
      casesScanned: activeCases.length,
      flagsFound: allFlags.length,
      riskScore: calculateRiskScore(allFlags),
      completedAt: new Date(),
    },
  })

  // Create flags with run ID
  if (allFlags.length > 0) {
    await prisma.auditFlag.createMany({
      data: allFlags.map(f => ({ ...f, runId: run.id })),
    })
  }

  return { run, flagCount: allFlags.length }
}

function calculateRiskScore(
  flags: Omit<AuditFlag, 'id' | 'createdAt' | 'resolvedAt' | 'resolvedBy'>[]
): number {
  const weights = { CRITICAL: 10, HIGH: 5, MEDIUM: 2, LOW: 1 }
  const total = flags.reduce((sum, f) => sum + (weights[f.severity as keyof typeof weights] ?? 1), 0)
  return Math.min(100, total)
}

export async function generateAuditSummary(runId: string): Promise<string> {
  const run = await prisma.auditRun.findUnique({
    where: { id: runId },
    include: {
      flags: {
        include: { case: true },
        orderBy: { severity: 'asc' },
        take: 20,
      },
    },
  })

  if (!run) return 'Audit run not found'

  const flagsSummary = run.flags
    .map(f => `- [${f.severity}] ${f.case.caseNumber}: ${f.title}`)
    .join('\n')

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `You are an AI legal analyst for Paul Padda Law in Las Vegas, NV. Summarize this audit run in 3-4 sentences for the attorney's morning briefing. Be concise and action-oriented.

Audit Results:
- Cases scanned: ${run.casesScanned}
- Flags found: ${run.flagsFound}
- Risk score: ${run.riskScore}/100

Top flags:
${flagsSummary}

Write a brief executive summary.`,
      },
    ],
  })

  return (msg.content[0] as { text: string }).text
}
