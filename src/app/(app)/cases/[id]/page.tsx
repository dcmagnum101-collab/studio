import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { CaseStatusBadge, PipelineStageBadge, PriorityBadge, SeverityBadge } from '@/components/cases/status-badge'
import { SolCountdown } from '@/components/cases/sol-countdown'
import { CaseDetailTabs } from './case-detail-tabs'
import { formatCurrency, formatLA, daysUntil, CASE_TYPE_LABELS, STAGE_LABELS } from '@/lib/utils'
import { ArrowLeft, Calendar, User, DollarSign, FileText } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getCase(id: string) {
  const c = await prisma.case.findUnique({
    where: { id },
    include: {
      client: true,
      assignedTo: { select: { id: true, name: true, email: true, role: true } },
      contacts: {
        include: { contact: true },
      },
      tasks: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      },
      documents: { orderBy: { createdAt: 'desc' } },
      notes: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      timeEntries: {
        include: { user: { select: { name: true } } },
        orderBy: { date: 'desc' },
      },
      auditFlags: {
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      },
      stageHistory: { orderBy: { movedAt: 'desc' } },
    },
  })
  return c
}

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) redirect('/login')

  const c = await getCase(params.id)
  if (!c) notFound()

  const solDays = daysUntil(c.statute)
  const totalHours = c.timeEntries.reduce((s, e) => s + e.hours, 0)

  return (
    <div className="p-4 space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/cases" className="text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <span className="text-[11px] text-slate-600">Cases</span>
        <span className="text-[11px] text-slate-600">/</span>
        <span className="text-[11px] text-[#C9A84C] font-data">{c.caseNumber}</span>
      </div>

      {/* Case Header */}
      <div className="bg-[#0D1421] border border-[#1a2332] rounded-lg p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-data text-[#C9A84C]">{c.caseNumber}</span>
              <CaseStatusBadge value={c.status} />
              <PipelineStageBadge value={c.stage} />
              <PriorityBadge value={c.priority} />
            </div>
            <h1 className="text-lg font-semibold text-white leading-tight">{c.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              {CASE_TYPE_LABELS[c.type] ?? c.type} ·{' '}
              <Link
                href={`/contacts/${c.client.id}`}
                className="text-[#C9A84C] hover:underline"
              >
                {c.client.firstName} {c.client.lastName}
              </Link>
            </p>
          </div>

          {/* Meta stats */}
          <div className="flex items-center gap-6 shrink-0">
            {c.estimatedValue && (
              <div className="text-center">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">Est. Value</p>
                <p className="text-sm font-bold text-[#C9A84C] font-data">
                  {formatCurrency(c.estimatedValue)}
                </p>
              </div>
            )}
            <div className="text-center">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">SOL</p>
              <SolCountdown statute={c.statute} />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Opened</p>
              <p className="text-xs font-data text-slate-400">
                {formatLA(c.dateOpened, 'MM/dd/yyyy')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Attorney</p>
              <p className="text-xs text-slate-400">{c.assignedTo.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <CaseDetailTabs
        caseId={c.id}
        caseNumber={c.caseNumber}
        overview={{
          description: c.description,
          incidentDate: c.incidentDate.toISOString(),
          statute: c.statute.toISOString(),
          dateOpened: c.dateOpened.toISOString(),
          stage: c.stage,
          type: c.type,
          estimatedValue: c.estimatedValue,
          settlementOffer: c.settlementOffer,
          settlementFinal: c.settlementFinal,
          assignedTo: c.assignedTo,
          client: {
            id: c.client.id,
            firstName: c.client.firstName,
            lastName: c.client.lastName,
            email: c.client.email,
            phone: c.client.phone,
            address: c.client.address,
            city: c.client.city,
            state: c.client.state,
          },
          stageHistory: c.stageHistory.map(sh => ({
            id: sh.id,
            fromStage: sh.fromStage,
            toStage: sh.toStage,
            movedAt: sh.movedAt.toISOString(),
            notes: sh.notes,
          })),
          totalHours,
        }}
        tasks={c.tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          dueDate: t.dueDate.toISOString(),
          priority: t.priority,
          status: t.status,
          category: t.category,
          assignedTo: t.assignedTo.name,
          completedAt: t.completedAt?.toISOString(),
        }))}
        documents={c.documents.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category,
          url: d.url,
          size: d.size,
          uploadedBy: d.uploadedBy,
          createdAt: d.createdAt.toISOString(),
          signedAt: d.signedAt?.toISOString(),
        }))}
        notes={c.notes.map(n => ({
          id: n.id,
          content: n.content,
          authorName: n.author.name,
          createdAt: n.createdAt.toISOString(),
        }))}
        auditFlags={c.auditFlags.map(f => ({
          id: f.id,
          type: f.type,
          severity: f.severity,
          title: f.title,
          description: f.description,
          recommendation: f.recommendation,
          urgency: f.urgency,
          isResolved: f.isResolved,
          resolvedAt: f.resolvedAt?.toISOString(),
          createdAt: f.createdAt.toISOString(),
        }))}
        currentUserId={session.user?.id ?? ''}
      />
    </div>
  )
}
