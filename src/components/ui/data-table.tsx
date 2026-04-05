'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  key: string
  label: string
  sortable?: boolean
  className?: string
  headerClassName?: string
  render?: (row: T) => React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableProps<T extends Record<string, any> = Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  pageSize?: number
  emptyMessage?: string
  rowClassName?: (row: T) => string
  onRowClick?: (row: T) => void
  keyField?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any> = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  pageSize = 25,
  emptyMessage = 'No records found.',
  rowClassName,
  onRowClick,
  keyField = 'id',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp =
        typeof av === 'string' && typeof bv === 'string'
          ? av.localeCompare(bv)
          : (av as number) < (bv as number)
          ? -1
          : (av as number) > (bv as number)
          ? 1
          : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const slice = sorted.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a2332]">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-slate-300 transition-colors',
                    col.headerClassName
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="w-3 h-3 text-[#C9A84C]" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-[#C9A84C]" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#111827]">
                  {columns.map(col => (
                    <td key={col.key} className="px-3 py-2">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : slice.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              slice.map((row, i) => (
                <tr
                  key={String(row[keyField] ?? i)}
                  className={cn(
                    'border-b border-[#111827] transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-white/[0.02]',
                    rowClassName?.(row)
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={cn('px-3 py-2 text-xs text-slate-300', col.className)}
                    >
                      {col.render ? col.render(row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#1a2332]">
          <span className="text-[11px] text-slate-500">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <span className="text-[11px] text-slate-500 px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
