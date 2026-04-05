import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { daysUntil } from '@/lib/utils'
import { STAGE_THRESHOLDS, REQUIRED_DOCS } from './constants'
import type { AuditFlag } from '@prisma/client'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Audit input builder ──────────────────────────────────────

export interface CaseAuditInput {
  caseNumber: string
  type: string
  stage: string
  daysInStage: number
  daysSinceActivity: number
  solDate: string
  daysUntilSOL: number
  priority: string
  estimatedValue: number | null
  settlementOffer: number | null
  openTasks: Array<{ title: string; dueDate: Date }>
  overdueTasks: Array<{ title: string; dueDate: Date }>
  documents: Array<{ category: string }>
  missingDocs: string[]
  description: string | null
}

export interface AuditReport {
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  summary: string
  nextBestAction: string
  flags: Array<{
    type: string
    severity: string
    title: string
    description: string
    recommendation: string
    urgency: string
  }>
}

function buildAuditInput(c: {
  caseNumber: string
  type: string
  stage: string
  stageEnteredAt: Date
  priority: string
  estimatedValue: number | null
  settlementOffer: number | null
  statute: Date
  description: string | null
  tasks: Array<{ title: string; status: string; dueDate: Date }>
  documents: Array<{ category: string }>
  notes: Array<{ createdAt: Date }>
  updatedAt: Date
}): CaseAuditInput {
  const daysInStage = Math.abs(daysUntil(c.stageEnteredAt))
  const lastActivity = c.notes[0]?.createdAt ?? c.updatedAt
  const daysSinceActivity = Math.abs(daysUntil(lastActivity))

  const openTasks = c.tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
  const overdueTasks = openTasks.filter(t => t.dueDate < new Date())

  const docCategories = c.documents.map(d => d.category)
  const required = REQUIRED_DOCS[c.type] ?? REQUIRED_DOCS.DEFAULT ?? []
  const missingDocs = required.filter(d => !docCategories.includes(d))

  return {
    caseNumber: c.caseNumber,
    type: c.type,
    stage: c.stage,
    daysInStage,
    daysSinceActivity,
    solDate: c.statute.toLocaleDateString(),
    daysUntilSOL: daysUntil(c.statute),
    priority: c.priority,
    estimatedValue: c.estimatedValue,
    settlementOffer: c.settlementOffer,
    openTasks: openTasks.map(t => ({ title: t.title, dueDate: t.dueDate })),
    overdueTasks: overdueTasks.map(t => ({ title: t.title, dueDate: t.dueDate })),
    documents: c.documents,
    missingDocs,
    description: c.description,
  }
}

// ─── Full Claude audit prompt ─────────────────────────────────

function buildAuditPrompt(input: CaseAuditInput): string {
  return `You are a senior legal case auditor for Paul Padda Law, a plaintiff personal injury firm in Las Vegas, NV.

Audit this case and return a JSON report identifying all risks, bottlenecks, and action items.

CASE DATA:
Case Number: ${input.caseNumber}
Case Type: ${input.type}
Current Stage: ${input.stage}
Days in Current Stage: ${input.daysInStage} (threshold: ${STAGE_THRESHOLDS[input.stage] ?? 30} days)
Days Since Last Activity: ${input.daysSinceActivity}
SOL Date: ${input.solDate}
Days Until SOL: ${input.daysUntilSOL}
Priority: ${input.priority}
Estimated Value: $${input.estimatedValue?.toLocaleString() ?? 'Not set'}
Settlement Offer: $${input.settlementOffer?.toLocaleString() ?? 'None'}
Open Tasks: ${input.openTasks.length} (${input.overdueTasks.length} overdue)
Overdue Tasks: ${input.overdueTasks.map(t => t.title).join(', ') || 'None'}
Documents Present: ${input.documents.map(d => d.category).join(', ') || 'None'}
Required Documents Missing: ${input.missingDocs.join(', ') || 'None'}
Case Description: ${input.description ?? 'Not provided'}

STAGE THRESHOLDS (days before flagged as stalled):
${JSON.stringify(STAGE_THRESHOLDS)}

REQUIRED DOCUMENTS FOR THIS CASE TYPE:
${JSON.stringify(REQUIRED_DOCS[input.type] ?? [])}

Return ONLY valid JSON — no markdown, no explanation, just the JSON object:
{
  "riskScore": <number 0-100>,
  "riskLevel": <"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">,
  "summary": "<2-3 sentence plain English case health summary>",
  "nextBestAction": "<single most important action to take on this case right now>",
  "flags": [
    {
      "type": <"BOTTLENECK" | "SOL_WARNING" | "MISSING_DOC" | "STALLED" | "UNDERVALUED" | "OVERDUE_TASK" | "NO_ACTIVITY">,
      "severity": <"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">,
      "title": "<concise flag title>",
      "description": "<what the problem is and why it matters>",
      "recommendation": "<specific, actionable step to resolve this flag>",
      "urgency": <"IMMEDIATE" | "THIS_WEEK" | "THIS_MONTH">
    }
  ]
}`
}

// ─── Audit a single case via Claude ──────────────────────────

export async function auditCaseWithClaude(input: CaseAuditInput): Promise<AuditReport> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: buildAuditPrompt(input) }],
  })

  const text = (msg.content[0] as { text: string }).text.trim()

  // Strip markdown code fences if Claude wraps in ```json
  const jsonText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '')

  return JSON.parse(jsonText) as AuditReport
}

// ─── Save audit flags to DB ───────────────────────────────────

async function saveAuditFlags(
  caseId: string,
  runId: string,
  report: AuditReport
): Promise<void> {
  if (report.flags.length === 0) return

  await prisma.auditFlag.createMany({
    data: report.flags.map(f => ({
      caseId,
      runId,
      type: f.type as never,
      severity: f.severity as never,
      urgency: f.urgency as never,
      title: f.title,
      description: f.description,
      recommendation: f.recommendation,
      isResolved: false,
    })),
  })
}

// ─── Run full audit (non-streaming, used by cron) ─────────────

export async function runFullAudit(
  userId: string,
  type: 'SCHEDULED' | 'MANUAL' = 'MANUAL'
) {
  const activeCases = await prisma.case.findMany({
    where: { status: 'ACTIVE' },
    include: {
      tasks: true,
      documents: true,
      notes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  const run = await prisma.auditRun.create({
    data: {
      triggeredBy: userId,
      type,
      casesScanned: activeCases.length,
      flagsFound: 0,
      riskScore: 0,
    },
  })

  let totalFlags = 0
  let totalRisk = 0

  for (const c of activeCases) {
    try {
      const input = buildAuditInput(c)
      const report = await auditCaseWithClaude(input)
      await saveAuditFlags(c.id, run.id, report)
      totalFlags += report.flags.length
      totalRisk += report.riskScore
    } catch (err) {
      console.error(`[audit] Case ${c.caseNumber} failed:`, err)
    }
  }

  const avgRisk = activeCases.length > 0 ? totalRisk / activeCases.length : 0

  await prisma.auditRun.update({
    where: { id: run.id },
    data: {
      flagsFound: totalFlags,
      riskScore: avgRisk,
      completedAt: new Date(),
    },
  })

  return { run, flagCount: totalFlags }
}

// ─── Single case audit ────────────────────────────────────────

export async function auditSingleCase(caseId: string, userId: string) {
  const c = await prisma.case.findUniqueOrThrow({
    where: { id: caseId },
    include: {
      tasks: true,
      documents: true,
      notes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  const run = await prisma.auditRun.create({
    data: {
      triggeredBy: userId,
      type: 'SINGLE_CASE',
      casesScanned: 1,
      flagsFound: 0,
      riskScore: 0,
    },
  })

  const input = buildAuditInput(c)
  const report = await auditCaseWithClaude(input)
  await saveAuditFlags(c.id, run.id, report)

  await prisma.auditRun.update({
    where: { id: run.id },
    data: { flagsFound: report.flags.length, riskScore: report.riskScore, completedAt: new Date() },
  })

  return { run, report }
}
