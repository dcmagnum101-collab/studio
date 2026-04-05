'use client'

import { useState, useMemo } from 'react'
import { DataTable, Column } from '@/components/ui/data-table'
import { TaskStatusBadge, PriorityBadge } from '@/components/cases/status-badge'
import { formatLA, cn } from '@/lib/utils'
import { Search, Filter, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface TaskRow {
  id: string
  title: string
  description: string | null
  caseId: string | null
  caseNumber: string | null
  caseTitle: string | null
  dueDate: string
  priority: string
  status: string
  category: string
  assignedToId: string
  assignedToName: string
  completedAt: string | null
}

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const CATEGORIES = [
  'FILING', 'DISCOVERY', 'DEPOSITION', 'CLIENT_CONTACT', 'COURT_DATE',
  'MEDICAL_REQUEST', 'DEMAND_LETTER', 'NEGOTIATION', 'ADMINISTRATIVE', 'OTHER',
]

export function TasksTable({
  data,
  users,
}: {
  data: TaskRow[]
  users: { id: string; name: string }[]
}) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterUser, setFilterUser] = useState('')

  const filtered = useMemo(() => {
    return data.filter(row => {
      const q = search.toLowerCase()
      if (q && !row.title.toLowerCase().includes(q) && !(row.caseNumber ?? '').toLowerCase().includes(q)) return false
      if (filterStatus && row.status !== filterStatus) return false
      if (filterPriority && row.priority !== filterPriority) return false
      if (filterCategory && row.category !== filterCategory) return false
      if (filterUser && row.assignedToId !== filterUser) return false
      return true
    })
  }, [data, search, filterStatus, filterPriority, filterCategory, filterUser])

  async function markComplete(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    window.location.reload()
  }

  const columns: Column[] = [
    {
      key: 'status',
      label: '',
      className: 'w-8',
      render: row => (
        <button
          onClick={e => {
            e.stopPropagation()
            if (row.status !== 'COMPLETED') markComplete(row.id)
          }}
          title={row.status === 'COMPLETED' ? 'Completed' : 'Mark complete'}
        >
          <CheckCircle2
            className={cn(
              'w-4 h-4 transition-colors',
              row.status === 'COMPLETED'
                ? 'text-emerald-400'
                : 'text-slate-600 hover:text-slate-400'
            )}
          />
        </button>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: row => (
        <span
          className={cn(
            'text-xs font-medium',
            row.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-white'
          )}
        >
          {row.title}
        </span>
      ),
    },
    {
      key: 'caseNumber',
      label: 'Case',
      sortable: true,
      render: row =>
        row.caseId ? (
          <Link
            href={`/cases/${row.caseId}`}
            onClick={e => e.stopPropagation()}
            className="text-[11px] font-data text-[#C9A84C] hover:underline"
          >
            {row.caseNumber}
          </Link>
        ) : (
          <span className="text-[11px] text-slate-600">—</span>
        ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: row => {
        const overdue = row.status !== 'COMPLETED' && new Date(row.dueDate) < new Date()
        return (
          <span className={cn('text-xs font-data', overdue ? 'text-red-400' : 'text-slate-400')}>
            {formatLA(row.dueDate)}
          </span>
        )
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: row => <PriorityBadge value={row.priority} />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: row => <TaskStatusBadge value={row.status} />,
    },
    {
      key: 'category',
      label: 'Category',
      render: row => (
        <span className="text-[11px] text-slate-500">
          {row.category.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'assignedToName',
      label: 'Assigned To',
      sortable: true,
      render: row => <span className="text-xs text-slate-400">{row.assignedToName}</span>,
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#1a2332]">
        <div className="flex items-center gap-1.5 bg-[#060E1B] border border-[#1a2332] rounded px-2 py-1.5 flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3 h-3 text-slate-600 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks, case #…"
            className="bg-transparent text-xs text-white placeholder:text-slate-600 outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3 h-3 text-slate-600" />
          {[
            { value: filterStatus, setter: setFilterStatus, options: STATUSES, placeholder: 'All Statuses' },
            { value: filterPriority, setter: setFilterPriority, options: PRIORITIES, placeholder: 'All Priorities' },
          ].map(({ value, setter, options, placeholder }) => (
            <select
              key={placeholder}
              value={value}
              onChange={e => setter(e.target.value)}
              className="bg-[#060E1B] border border-[#1a2332] text-xs text-slate-400 rounded px-2 py-1.5 outline-none"
            >
              <option value="">{placeholder}</option>
              {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          ))}
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="bg-[#060E1B] border border-[#1a2332] text-xs text-slate-400 rounded px-2 py-1.5 outline-none"
          >
            <option value="">All Assignees</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <span className="text-[11px] text-slate-600 ml-auto">
          {filtered.length} of {data.length}
        </span>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        pageSize={30}
        emptyMessage="No tasks match your filters."
      />
    </div>
  )
}
