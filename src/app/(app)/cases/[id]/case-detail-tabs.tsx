'use client'

import { useState } from 'react'
import { cn, formatLA, formatCurrency, CASE_TYPE_LABELS, STAGE_LABELS } from '@/lib/utils'
import { TaskStatusBadge, PriorityBadge, SeverityBadge } from '@/components/cases/status-badge'
import { SolCountdown } from '@/components/cases/sol-countdown'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, FileText, ExternalLink, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface OverviewData {
  description: string | null
  incidentDate: string
  statute: string
  dateOpened: string
  stage: string
  type: string
  estimatedValue: number | null
  settlementOffer: number | null
  settlementFinal: number | null
  assignedTo: { name: string; role: string; email: string }
  client: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
  }
  stageHistory: {
    id: string
    fromStage: string | null
    toStage: string
    movedAt: string
    notes: string | null
  }[]
  totalHours: number
}

interface TaskData {
  id: string
  title: string
  description: string | null
  dueDate: string
  priority: string
  status: string
  category: string
  assignedTo: string
  completedAt?: string
}

interface DocumentData {
  id: string
  name: string
  category: string
  url: string
  size: number
  uploadedBy: string
  createdAt: string
  signedAt?: string
}

interface NoteData {
  id: string
  content: string
  authorName: string
  createdAt: string
}

interface FlagData {
  id: string
  type: string
  severity: string
  title: string
  description: string
  recommendation: string
  urgency: string
  isResolved: boolean
  resolvedAt?: string
  createdAt: string
}

interface CaseDetailTabsProps {
  caseId: string
  caseNumber: string
  overview: OverviewData
  tasks: TaskData[]
  documents: DocumentData[]
  notes: NoteData[]
  auditFlags: FlagData[]
  currentUserId: string
}

const TABS = ['Overview', 'Tasks', 'Documents', 'Notes', 'Audit Flags'] as const
type Tab = typeof TABS[number]

export function CaseDetailTabs({
  caseId,
  caseNumber,
  overview,
  tasks,
  documents,
  notes,
  auditFlags,
  currentUserId,
}: CaseDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  async function submitNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      await fetch(`/api/cases/${caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      })
      setNewNote('')
      window.location.reload()
    } finally {
      setSavingNote(false)
    }
  }

  async function resolveFlag(flagId: string) {
    await fetch(`/api/audit/flags/${flagId}/resolve`, { method: 'PATCH' })
    window.location.reload()
  }

  const unresolvedFlags = auditFlags.filter(f => !f.isResolved)

  return (
    <div className="bg-[#0D1421] border border-[#1a2332] rounded-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[#1a2332] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2',
              activeTab === tab
                ? 'border-[#C9A84C] text-[#C9A84C]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            {tab}
            {tab === 'Tasks' && tasks.filter(t => t.status !== 'COMPLETED').length > 0 && (
              <span className="ml-1.5 text-[10px] bg-[#1a2332] text-slate-400 px-1.5 py-0.5 rounded-full">
                {tasks.filter(t => t.status !== 'COMPLETED').length}
              </span>
            )}
            {tab === 'Audit Flags' && unresolvedFlags.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                {unresolvedFlags.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'Overview' && (
        <div className="p-4 space-y-4">
          {overview.description && (
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Description</p>
              <p className="text-xs text-slate-300 leading-relaxed">{overview.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DetailField label="Case Type" value={CASE_TYPE_LABELS[overview.type] ?? overview.type} />
            <DetailField label="Incident Date" value={formatLA(overview.incidentDate)} />
            <DetailField label="SOL Date" value={formatLA(overview.statute)} />
            <DetailField label="Date Opened" value={formatLA(overview.dateOpened)} />
            {overview.estimatedValue != null && (
              <DetailField label="Estimated Value" value={formatCurrency(overview.estimatedValue)} gold />
            )}
            {overview.settlementOffer != null && (
              <DetailField label="Settlement Offer" value={formatCurrency(overview.settlementOffer)} />
            )}
            {overview.settlementFinal != null && (
              <DetailField label="Final Settlement" value={formatCurrency(overview.settlementFinal)} gold />
            )}
            <DetailField label="Total Hours Billed" value={`${overview.totalHours.toFixed(1)}h`} />
          </div>

          {/* Client & Attorney */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#060E1B] rounded-lg p-3 border border-[#1a2332]">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Client</p>
              <Link
                href={`/contacts/${overview.client.id}`}
                className="text-sm font-medium text-white hover:text-[#C9A84C] transition-colors"
              >
                {overview.client.firstName} {overview.client.lastName}
              </Link>
              {overview.client.phone && (
                <p className="text-xs text-slate-400 mt-1">{overview.client.phone}</p>
              )}
              {overview.client.email && (
                <p className="text-xs text-slate-500 mt-0.5">{overview.client.email}</p>
              )}
              {overview.client.address && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {overview.client.address}
                  {overview.client.city && `, ${overview.client.city}`}
                  {overview.client.state && `, ${overview.client.state}`}
                </p>
              )}
            </div>
            <div className="bg-[#060E1B] rounded-lg p-3 border border-[#1a2332]">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Assigned Attorney</p>
              <p className="text-sm font-medium text-white">{overview.assignedTo.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{overview.assignedTo.role}</p>
              <p className="text-xs text-slate-500 mt-0.5">{overview.assignedTo.email}</p>
            </div>
          </div>

          {/* Stage History */}
          {overview.stageHistory.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Stage History</p>
              <div className="space-y-1">
                {overview.stageHistory.slice(0, 5).map(sh => (
                  <div key={sh.id} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-data text-[10px] text-slate-600">
                      {formatLA(sh.movedAt, 'MM/dd/yy')}
                    </span>
                    {sh.fromStage && (
                      <>
                        <span className="text-slate-600">{STAGE_LABELS[sh.fromStage] ?? sh.fromStage}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                      </>
                    )}
                    <span className="text-[#C9A84C]">{STAGE_LABELS[sh.toStage] ?? sh.toStage}</span>
                    {sh.notes && <span className="text-slate-600">· {sh.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tasks */}
      {activeTab === 'Tasks' && (
        <div className="p-4">
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No tasks for this case.</p>
          ) : (
            <div className="space-y-1.5">
              {tasks.map(task => {
                const overdue = task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date()
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-2.5 rounded border border-[#1a2332] bg-[#060E1B]/50"
                  >
                    <CheckCircle2
                      className={cn(
                        'w-4 h-4 mt-0.5 shrink-0',
                        task.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-600'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'text-xs font-medium',
                            task.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-white'
                          )}
                        >
                          {task.title}
                        </span>
                        <TaskStatusBadge value={task.status} />
                        <PriorityBadge value={task.priority} />
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className={cn(
                            'text-[11px] font-data',
                            overdue ? 'text-red-400' : 'text-slate-500'
                          )}
                        >
                          Due: {formatLA(task.dueDate)}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          {task.category.replace('_', ' ')} · {task.assignedTo}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {activeTab === 'Documents' && (
        <div className="p-4">
          {documents.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No documents uploaded.</p>
          ) : (
            <div className="space-y-1">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 py-2 border-b border-[#111827] last:border-0"
                >
                  <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{doc.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {doc.category.replace('_', ' ')} · {(doc.size / 1024).toFixed(0)} KB ·{' '}
                      {formatLA(doc.createdAt)}
                    </p>
                  </div>
                  {doc.signedAt && (
                    <Badge variant="success" className="shrink-0">Signed</Badge>
                  )}
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-[#C9A84C] transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {activeTab === 'Notes' && (
        <div className="p-4 space-y-4">
          {/* New note */}
          <div className="bg-[#060E1B] border border-[#1a2332] rounded-lg p-3">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Add a note to this case…"
              rows={3}
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-600 outline-none resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={submitNote}
                disabled={!newNote.trim() || savingNote}
                className="bg-[#C9A84C] hover:bg-[#b8953e] disabled:opacity-50 text-[#0A1628] font-semibold text-xs px-3 py-1.5 rounded transition-colors"
              >
                {savingNote ? 'Saving…' : 'Add Note'}
              </button>
            </div>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="bg-[#060E1B] border border-[#1a2332] rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-medium text-slate-400">{note.authorName}</span>
                    <span className="text-[10px] text-slate-600 font-data">
                      {formatLA(note.createdAt, 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Flags */}
      {activeTab === 'Audit Flags' && (
        <div className="p-4 space-y-2">
          {auditFlags.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No audit flags for this case.</p>
          ) : (
            auditFlags.map(flag => (
              <div
                key={flag.id}
                className={cn(
                  'border rounded-lg p-3',
                  flag.isResolved
                    ? 'border-[#1a2332] opacity-50'
                    : flag.severity === 'CRITICAL' || flag.severity === 'HIGH'
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-[#1a2332] bg-[#060E1B]'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SeverityBadge value={flag.severity} />
                    <span className="text-xs font-medium text-white">{flag.title}</span>
                    {flag.isResolved && (
                      <Badge variant="success">Resolved</Badge>
                    )}
                  </div>
                  {!flag.isResolved && (
                    <button
                      onClick={() => resolveFlag(flag.id)}
                      className="text-[11px] text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                    >
                      Resolve
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {flag.description}
                </p>
                <div className="mt-2 p-2 bg-[#C9A84C]/5 border border-[#C9A84C]/10 rounded text-[11px] text-[#C9A84C]">
                  Recommendation: {flag.recommendation}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-slate-600 font-data">
                    {formatLA(flag.createdAt, 'MM/dd/yyyy')}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    Urgency: {flag.urgency.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function DetailField({
  label,
  value,
  gold,
}: {
  label: string
  value: string
  gold?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</p>
      <p className={cn('text-xs mt-0.5 font-data', gold ? 'text-[#C9A84C]' : 'text-slate-300')}>
        {value}
      </p>
    </div>
  )
}
