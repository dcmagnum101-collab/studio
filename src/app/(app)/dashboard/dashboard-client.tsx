'use client'

import { useState } from 'react'
import { LayoutGrid, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KanbanBoard } from './kanban-board'

interface DashboardClientProps {
  chartsSection: React.ReactNode
}

export function DashboardClient({ chartsSection }: DashboardClientProps) {
  const [view, setView] = useState<'charts' | 'kanban'>('charts')

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center gap-1 bg-[#0D1421] border border-[#1a2332] rounded p-0.5 w-fit">
        <button
          onClick={() => setView('charts')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all',
            view === 'charts'
              ? 'bg-gold/10 text-gold'
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <BarChart3 className="w-3 h-3" />
          Charts
        </button>
        <button
          onClick={() => setView('kanban')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all',
            view === 'kanban'
              ? 'bg-gold/10 text-gold'
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <LayoutGrid className="w-3 h-3" />
          Pipeline Board
        </button>
      </div>

      {view === 'charts' ? chartsSection : (
        <div className="bg-[#0A1628] border border-[#1a2332] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              Pipeline Board
            </h2>
            <p className="text-[11px] text-slate-500">Drag cards to move between stages</p>
          </div>
          <KanbanBoard />
        </div>
      )}
    </>
  )
}
