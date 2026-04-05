'use client'

import { useState, useMemo } from 'react'
import { cn, formatLA } from '@/lib/utils'
import { FileText, Search, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Document {
  id: string
  name: string
  category: string
  url: string
  size: number
  mimeType: string
  uploadedBy: string
  docusignId?: string
  signedAt?: string
  createdAt: string
  case: { id: string; caseNumber: string; title: string }
}

const CATEGORY_COLORS: Record<string, string> = {
  MEDICAL_RECORDS: 'text-blue-400 bg-blue-400/10',
  MEDICAL_BILLS: 'text-cyan-400 bg-cyan-400/10',
  POLICE_REPORT: 'text-orange-400 bg-orange-400/10',
  PHOTOS: 'text-purple-400 bg-purple-400/10',
  INSURANCE_POLICY: 'text-teal-400 bg-teal-400/10',
  DEMAND_LETTER: 'text-red-400 bg-red-400/10',
  SETTLEMENT_DOCS: 'text-emerald-400 bg-emerald-400/10',
  PLEADINGS: 'text-yellow-400 bg-yellow-400/10',
  DISCOVERY: 'text-indigo-400 bg-indigo-400/10',
  CORRESPONDENCE: 'text-slate-400 bg-slate-400/10',
  RETAINER: 'text-gold bg-gold/10',
  EXPERT_REPORT: 'text-pink-400 bg-pink-400/10',
  WAGE_RECORDS: 'text-lime-400 bg-lime-400/10',
  OTHER: 'text-slate-500 bg-slate-500/10',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function DocumentsClient({ documents }: { documents: Document[] }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(documents.map(d => d.category)))],
    [documents]
  )

  const filtered = useMemo(
    () =>
      documents.filter(d => {
        const matchesSearch =
          !search ||
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.case.caseNumber.toLowerCase().includes(search.toLowerCase())
        const matchesCat = categoryFilter === 'ALL' || d.category === categoryFilter
        return matchesSearch && matchesCat
      }),
    [documents, search, categoryFilter]
  )

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-8 pr-3 py-1.5 bg-card border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {categories.slice(0, 6).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-2.5 py-1 rounded text-[11px] font-medium transition-all',
                categoryFilter === cat
                  ? 'bg-gold/10 text-gold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {cat === 'ALL' ? 'All' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {filtered.length} document{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Name', 'Case', 'Category', 'Uploaded By', 'Date', 'Size', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => (
              <tr
                key={doc.id}
                className={cn(
                  'border-b border-border/50 hover:bg-muted/20 transition-colors',
                  i % 2 === 0 ? '' : 'bg-muted/10'
                )}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[12px] text-foreground truncate max-w-[180px]">{doc.name}</span>
                    {doc.signedAt && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1 rounded shrink-0">
                        Signed
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/cases/${doc.case.id}`} className="text-[12px] text-gold hover:text-gold/80 font-data">
                    {doc.case.caseNumber}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS.OTHER)}>
                    {doc.category.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-3 py-2 text-[12px] text-muted-foreground">{doc.uploadedBy}</td>
                <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">
                  {formatLA(doc.createdAt, 'MMM d, yyyy')}
                </td>
                <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">
                  {formatFileSize(doc.size)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={doc.url}
                      download={doc.name}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No documents found.
          </div>
        )}
      </div>
    </div>
  )
}
