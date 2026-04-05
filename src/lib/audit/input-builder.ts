import { daysUntil } from '@/lib/utils'
import { REQUIRED_DOCS } from './constants'
import type { CaseAuditInput } from './engine'

export function buildAuditInput(c: {
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
