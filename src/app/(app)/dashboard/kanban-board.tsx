'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { cn, formatCurrency, daysUntil, STAGE_LABELS, PRIORITY_COLORS, solUrgency } from '@/lib/utils'
import { differenceInDays } from 'date-fns'
import { AlertTriangle, Clock, Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

interface KanbanCase {
  id: string
  caseNumber: string
  title: string
  type: string
  stage: string
  priority: string
  statute: string
  stageEnteredAt: string
  estimatedValue: number | null
  client: { firstName: string; lastName: string }
  assignedTo: { name: string }
  _count?: { tasks: number; auditFlags: number }
}

const STAGES = [
  'INTAKE',
  'INVESTIGATION',
  'DEMAND',
  'NEGOTIATION',
  'LITIGATION',
  'SETTLEMENT',
] as const

const STAGE_COLORS: Record<string, string> = {
  INTAKE: 'border-blue-500/30 bg-blue-500/5',
  INVESTIGATION: 'border-purple-500/30 bg-purple-500/5',
  DEMAND: 'border-amber-500/30 bg-amber-500/5',
  NEGOTIATION: 'border-orange-500/30 bg-orange-500/5',
  LITIGATION: 'border-red-500/30 bg-red-500/5',
  SETTLEMENT: 'border-emerald-500/30 bg-emerald-500/5',
}

const STAGE_DOT: Record<string, string> = {
  INTAKE: 'bg-blue-400',
  INVESTIGATION: 'bg-purple-400',
  DEMAND: 'bg-amber-400',
  NEGOTIATION: 'bg-orange-400',
  LITIGATION: 'bg-red-400',
  SETTLEMENT: 'bg-emerald-400',
}

// ─── Case Card ────────────────────────────────────────────────

function CaseCard({
  c,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  c: KanbanCase
  isDragging: boolean
  onDragStart: (e: React.DragEvent, id: string, stage: string) => void
  onDragEnd: () => void
}) {
  const daysInStage = differenceInDays(new Date(), new Date(c.stageEnteredAt))
  const solDays = daysUntil(c.statute)
  const solBadge = solUrgency(c.statute)

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, c.id, c.stage)}
      onDragEnd={onDragEnd}
      className={cn(
        'group bg-[#0D1421] border border-[#1a2332] rounded-lg p-3 cursor-grab active:cursor-grabbing select-none transition-all',
        isDragging ? 'opacity-40 scale-95' : 'hover:border-gold/20 hover:shadow-[0_0_12px_rgba(201,168,76,0.06)]'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <Link
          href={`/cases/${c.id}`}
          onClick={e => e.stopPropagation()}
          className="text-[11px] font-data text-gold hover:underline leading-none"
        >
          {c.caseNumber}
        </Link>
        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0', PRIORITY_COLORS[c.priority as keyof typeof PRIORITY_COLORS])}>
          {c.priority}
        </span>
      </div>

      {/* Title + client */}
      <p className="text-[12px] font-medium text-slate-200 leading-snug mb-0.5 line-clamp-2">
        {c.client.firstName} {c.client.lastName}
      </p>
      <p className="text-[10px] text-slate-500 truncate mb-2">{c.title}</p>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {daysInStage}d
          </span>
          {c.estimatedValue && c.estimatedValue > 0 && (
            <span className="text-gold/60">{formatCurrency(c.estimatedValue)}</span>
          )}
        </div>

        {solDays <= 60 && (
          <span className={cn(
            'flex items-center gap-0.5 font-data font-bold',
            solBadge === 'critical' ? 'text-red-400' :
            solBadge === 'high' ? 'text-orange-400' : 'text-yellow-400'
          )}>
            <AlertTriangle className="w-2.5 h-2.5" />
            {solDays}d SOL
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────

function KanbanColumn({
  stage,
  cases,
  draggingId,
  draggingFrom,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  stage: string
  cases: KanbanCase[]
  draggingId: string | null
  draggingFrom: string | null
  onDragStart: (e: React.DragEvent, id: string, stage: string) => void
  onDragEnd: () => void
  onDrop: (stage: string) => void
}) {
  const [isOver, setIsOver] = useState(false)
  const canDrop = draggingId !== null && draggingFrom !== stage

  const totalValue = cases.reduce((s, c) => s + (c.estimatedValue ?? 0), 0)

  return (
    <div
      className="flex flex-col min-w-[200px] w-full"
      onDragOver={e => { if (canDrop) { e.preventDefault(); setIsOver(true) } }}
      onDragLeave={() => setIsOver(false)}
      onDrop={() => { setIsOver(false); if (canDrop) onDrop(stage) }}
    >
      {/* Column header */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2 rounded-t-lg border border-b-0 mb-0',
        STAGE_COLORS[stage],
        isOver && canDrop ? 'brightness-125' : ''
      )}>
        <div className="flex items-center gap-1.5">
          <div className={cn('w-1.5 h-1.5 rounded-full', STAGE_DOT[stage])} />
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
            {STAGE_LABELS[stage]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {totalValue > 0 && (
            <span className="text-[9px] text-slate-500 font-data">
              {totalValue >= 1_000_000
                ? `$${(totalValue / 1_000_000).toFixed(1)}M`
                : `$${Math.round(totalValue / 1000)}K`}
            </span>
          )}
          <span className="text-[10px] font-data font-bold text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
            {cases.length}
          </span>
        </div>
      </div>

      {/* Drop zone + cards */}
      <div
        className={cn(
          'flex-1 p-2 space-y-2 rounded-b-lg border border-t-0 min-h-[120px] transition-all',
          STAGE_COLORS[stage],
          isOver && canDrop ? 'border-gold/40 bg-gold/5' : ''
        )}
      >
        {cases.map(c => (
          <CaseCard
            key={c.id}
            c={c}
            isDragging={draggingId === c.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {cases.length === 0 && (
          <div className={cn(
            'flex items-center justify-center h-16 rounded border border-dashed transition-all',
            isOver && canDrop ? 'border-gold/40 text-gold/60' : 'border-slate-800 text-slate-700'
          )}>
            <span className="text-[10px]">
              {isOver && canDrop ? 'Drop here' : 'Empty'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Kanban Board ─────────────────────────────────────────────

export function KanbanBoard() {
  const [cases, setCases] = useState<KanbanCase[]>([])
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [draggingFrom, setDraggingFrom] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/cases')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCases(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, id: string, stage: string) => {
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(id)
    setDraggingFrom(stage)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDraggingFrom(null)
  }, [])

  const handleDrop = useCallback(async (targetStage: string) => {
    if (!draggingId || draggingFrom === targetStage) return

    // Optimistic update
    setCases(prev => prev.map(c =>
      c.id === draggingId
        ? { ...c, stage: targetStage, stageEnteredAt: new Date().toISOString() }
        : c
    ))

    setMovingId(draggingId)
    setDraggingId(null)
    setDraggingFrom(null)

    try {
      await fetch(`/api/cases/${draggingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      })
    } catch {
      // Revert on error by refetching
      const res = await fetch('/api/cases')
      const data = await res.json()
      if (Array.isArray(data)) setCases(data)
    } finally {
      setMovingId(null)
    }
  }, [draggingId, draggingFrom])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 text-gold animate-spin" />
      </div>
    )
  }

  const byStage = Object.fromEntries(
    STAGES.map(s => [s, cases.filter(c => c.stage === s)])
  )

  return (
    <div className="overflow-x-auto pb-4 -mx-1">
      <div className="flex gap-3 px-1 min-w-max">
        {STAGES.map(stage => (
          <div key={stage} className="w-[210px] shrink-0">
            <KanbanColumn
              stage={stage}
              cases={byStage[stage] ?? []}
              draggingId={draggingId}
              draggingFrom={draggingFrom}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
          </div>
        ))}
      </div>

      {movingId && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border border-gold/30 text-gold text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-50">
          <Loader2 className="w-3 h-3 animate-spin" />
          Moving case...
        </div>
      )}
    </div>
  )
}
