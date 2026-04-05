'use client'

import { useState, useMemo } from 'react'
import { DataTable, Column } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Search, ExternalLink, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatLA } from '@/lib/utils'

interface DocRow {
  id: string
  name: string
  category: string
  caseId: string
  caseNumber: string
  caseTitle: string
  uploadedBy: string
  size: number
  mimeType: string
  url: string
  createdAt: string
  signedAt: string | null
}

const CATEGORIES = [
  'MEDICAL_RECORDS', 'MEDICAL_BILLS', 'POLICE_REPORT', 'PHOTOS',
  'INSURANCE_POLICY', 'DEMAND_LETTER', 'SETTLEMENT_DOCS', 'PLEADINGS',
  'DISCOVERY', 'CORRESPONDENCE', 'RETAINER', 'EXPERT_REPORT',
  'WAGE_RECORDS', 'OTHER',
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsTable({ data }: { data: DocRow[] }) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const filtered = useMemo(() =>
    data.filter(row => {
      const q = search.toLowerCase()
      if (q && !row.name.toLowerCase().includes(q) && !row.caseNumber.toLowerCase().includes(q)) return false
      if (filterCategory && row.category !== filterCategory) return false
      return true
    }),
    [data, search, filterCategory]
  )

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Document Name',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-xs text-white truncate max-w-[200px]">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: row => (
        <span className="text-[11px] text-slate-400">{row.category.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'caseNumber',
      label: 'Case',
      sortable: true,
      render: row => (
        <Link href={`/cases/${row.caseId}`} className="text-[11px] font-data text-[#C9A84C] hover:underline" onClick={e => e.stopPropagation()}>
          {row.caseNumber}
        </Link>
      ),
    },
    {
      key: 'uploadedBy',
      label: 'Uploaded By',
      render: row => <span className="text-xs text-slate-400">{row.uploadedBy}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: row => <span className="text-xs font-data text-slate-500">{formatLA(row.createdAt)}</span>,
    },
    {
      key: 'size',
      label: 'Size',
      sortable: true,
      render: row => <span className="text-xs font-data text-slate-500">{formatSize(row.size)}</span>,
    },
    {
      key: 'signedAt',
      label: 'Signed',
      render: row => row.signedAt ? (
        <Badge variant="success">Signed</Badge>
      ) : (
        <span className="text-[11px] text-slate-600">—</span>
      ),
    },
    {
      key: 'url',
      label: '',
      render: row => (
        <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-[#C9A84C] transition-colors" onClick={e => e.stopPropagation()}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ),
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
            placeholder="Search document name, case #…"
            className="bg-transparent text-xs text-white placeholder:text-slate-600 outline-none flex-1"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-[#060E1B] border border-[#1a2332] text-xs text-slate-400 rounded px-2 py-1.5 outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
        <span className="text-[11px] text-slate-600 ml-auto">{filtered.length} of {data.length}</span>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        pageSize={25}
        emptyMessage="No documents found."
      />
    </div>
  )
}
