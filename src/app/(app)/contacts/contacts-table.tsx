'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, Column } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatLA } from '@/lib/utils'

interface ContactRow {
  id: string
  firstName: string
  lastName: string
  fullName: string
  type: string
  company: string | null
  phone: string | null
  email: string | null
  caseCount: number
  createdAt: string
}

const CONTACT_TYPES = ['CLIENT', 'OPPOSING_COUNSEL', 'EXPERT_WITNESS', 'INSURANCE_ADJUSTER', 'DOCTOR', 'WITNESS', 'OTHER']

const typeVariantMap: Record<string, 'gold' | 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'cyan'> = {
  CLIENT: 'gold',
  OPPOSING_COUNSEL: 'danger',
  EXPERT_WITNESS: 'info',
  INSURANCE_ADJUSTER: 'warning',
  DOCTOR: 'success',
  WITNESS: 'muted',
  OTHER: 'muted',
}

export function ContactsTable({ data }: { data: ContactRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  const filtered = useMemo(() => {
    return data.filter(row => {
      const q = search.toLowerCase()
      if (q && !row.fullName.toLowerCase().includes(q) && !(row.company ?? '').toLowerCase().includes(q) && !(row.email ?? '').toLowerCase().includes(q)) return false
      if (filterType && row.type !== filterType) return false
      return true
    })
  }, [data, search, filterType])

  const columns: Column[] = [
    {
      key: 'fullName',
      label: 'Name',
      sortable: true,
      render: row => (
        <Link href={`/contacts/${row.id}`} className="text-white text-xs font-medium hover:text-[#C9A84C] transition-colors">
          {row.fullName}
        </Link>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: row => (
        <Badge variant={typeVariantMap[row.type] ?? 'muted'}>
          {row.type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'company',
      label: 'Company / Firm',
      sortable: true,
      render: row => <span className="text-xs text-slate-400">{row.company ?? '—'}</span>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: row => <span className="text-xs font-data text-slate-400">{row.phone ?? '—'}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: row => <span className="text-xs text-slate-400">{row.email ?? '—'}</span>,
    },
    {
      key: 'caseCount',
      label: 'Cases',
      sortable: true,
      render: row => (
        <span className="text-xs font-data text-slate-500">{row.caseCount}</span>
      ),
    },
    {
      key: 'id',
      label: '',
      render: row => (
        <Link
          href={`/contacts/${row.id}`}
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
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#1a2332]">
        <div className="flex items-center gap-1.5 bg-[#060E1B] border border-[#1a2332] rounded px-2 py-1.5 flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3 h-3 text-slate-600 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, company, email…"
            className="bg-transparent text-xs text-white placeholder:text-slate-600 outline-none flex-1"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-[#060E1B] border border-[#1a2332] text-xs text-slate-400 rounded px-2 py-1.5 outline-none"
        >
          <option value="">All Types</option>
          {CONTACT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <span className="text-[11px] text-slate-600 ml-auto">{filtered.length} of {data.length}</span>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        pageSize={30}
        emptyMessage="No contacts found."
        onRowClick={(row: ContactRow) => router.push(`/contacts/${row.id}`)}
      />
    </div>
  )
}
