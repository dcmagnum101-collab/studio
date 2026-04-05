'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, Column } from '@/components/ui/data-table'
import { CaseStatusBadge, PipelineStageBadge, PriorityBadge } from '@/components/cases/status-badge'
import { SolCountdown } from '@/components/cases/sol-countdown'
import { CASE_TYPE_LABELS, STAGE_LABELS, formatCurrency, formatLA } from '@/lib/utils'
import { Search, Filter, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface CaseRow {
  id: string
  caseNumber: string
  title: string
  client: string
  type: string
  stage: string
  status: string
  priority: string
  statute: string
  assignedTo: string
  estimatedValue: number
  dateOpened: string
}

const STATUSES = ['ACTIVE', 'INACTIVE', 'SETTLED', 'CLOSED', 'REFERRED']
const STAGES = ['INTAKE', 'INVESTIGATION', 'DEMAND', 'NEGOTIATION', 'LITIGATION', 'TRIAL', 'SETTLEMENT', 'CLOSED']
const TYPES = ['AUTO_ACCIDENT', 'PERSONAL_INJURY', 'SLIP_AND_FALL', 'WRONGFUL_DEATH', 'WORKERS_COMP', 'MEDICAL_MALPRACTICE', 'PRODUCT_LIABILITY', 'PREMISES_LIABILITY', 'OTHER']

export function CasesTable({ data }: { data: CaseRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterType, setFilterType] = useState('')

  const filtered = useMemo(() => {
    return data.filter(row => {
      const q = search.toLowerCase()
      if (q && !row.caseNumber.toLowerCase().includes(q) && !row.title.toLowerCase().includes(q) && !row.client.toLowerCase().includes(q)) return false
      if (filterStatus && row.status !== filterStatus) return false
      if (filterStage && row.stage !== filterStage) return false
      if (filterType && row.type !== filterType) return false
      return true
    })
  }, [data, search, filterStatus, filterStage, filterType])

  const columns: Column[] = [
    {
      key: 'caseNumber',
      label: 'Case #',
      sortable: true,
      className: 'font-data text-[#C9A84C] whitespace-nowrap',
      render: row => (
        <Link href={`/cases/${row.id}`} className="hover:underline font-data text-[#C9A84C]">
          {row.caseNumber}
        </Link>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      className: 'max-w-[200px]',
      render: row => (
        <span className="truncate block max-w-[200px] text-white text-xs">{row.title}</span>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      sortable: true,
      render: row => <span className="text-slate-300 text-xs">{row.client}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: row => (
        <span className="text-xs text-slate-400">{CASE_TYPE_LABELS[row.type] ?? row.type}</span>
      ),
    },
    {
      key: 'stage',
      label: 'Stage',
      sortable: true,
      render: row => <PipelineStageBadge value={row.stage} />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: row => <CaseStatusBadge value={row.status} />,
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: row => <PriorityBadge value={row.priority} />,
    },
    {
      key: 'statute',
      label: 'SOL',
      sortable: true,
      render: row => <SolCountdown statute={row.statute} />,
    },
    {
      key: 'estimatedValue',
      label: 'Est. Value',
      sortable: true,
      className: 'font-data text-right',
      headerClassName: 'text-right',
      render: row => (
        <span className="font-data text-xs text-slate-400">
          {row.estimatedValue > 0 ? formatCurrency(row.estimatedValue) : '—'}
        </span>
      ),
    },
    {
      key: 'assignedTo',
      label: 'Attorney',
      sortable: true,
      render: row => <span className="text-xs text-slate-400">{row.assignedTo}</span>,
    },
    {
      key: 'id',
      label: '',
      render: row => (
        <Link
          href={`/cases/${row.id}`}
          className="text-slate-600 hover:text-[#C9A84C] transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ]

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#1a2332]">
        <div className="flex items-center gap-1.5 bg-[#060E1B] border border-[#1a2332] rounded px-2 py-1.5 flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3 h-3 text-slate-600 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search case #, title, client…"
            className="bg-transparent text-xs text-white placeholder:text-slate-600 outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-slate-600" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#060E1B] border border-[#1a2332] text-xs text-slate-400 rounded px-2 py-1.5 outline-none focus:border-[#C9A84C]/40"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className="bg-[#060E1B] border border-[#1a2332] text-xs text-slate-400 rounded px-2 py-1.5 outline-none focus:border-[#C9A84C]/40"
          >
            <option value="">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s] ?? s}</option>)}
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#060E1B] border border-[#1a2332] text-xs text-slate-400 rounded px-2 py-1.5 outline-none focus:border-[#C9A84C]/40"
          >
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{CASE_TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>
        <span className="text-[11px] text-slate-600 ml-auto">
          {filtered.length} of {data.length}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={25}
        emptyMessage="No cases match your filters."
        onRowClick={(row: CaseRow) => router.push(`/cases/${row.id}`)}
      />
    </div>
  )
}
