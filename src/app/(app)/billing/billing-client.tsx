'use client'

import { useState } from 'react'
import { cn, formatCurrency, formatHours, formatLA } from '@/lib/utils'
import { Clock, DollarSign, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface TimeEntry {
  id: string
  description: string
  hours: number
  rate: number
  date: string
  billable: boolean
  qbSynced: boolean
  case: { id: string; caseNumber: string; title: string }
  user: { name: string }
}

interface Invoice {
  id: string
  amount: number
  status: string
  dueDate: string
  issuedAt: string
  case: { id: string; caseNumber: string; title: string }
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-slate-400 bg-slate-400/10',
  SENT: 'text-blue-400 bg-blue-400/10',
  PAID: 'text-emerald-400 bg-emerald-400/10',
  OVERDUE: 'text-red-400 bg-red-400/10',
  VOID: 'text-slate-600 bg-slate-600/10',
}

interface BillingClientProps {
  timeEntries: TimeEntry[]
  invoices: Invoice[]
  monthlyHours: number
  monthlyRevenue: number
}

export function BillingClient({ timeEntries, invoices, monthlyHours, monthlyRevenue }: BillingClientProps) {
  const [activeTab, setActiveTab] = useState<'time' | 'invoices'>('time')

  const totalBillableHours = timeEntries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0)
  const totalRevenue = timeEntries.filter(e => e.billable).reduce((s, e) => s + e.hours * e.rate, 0)
  const unpaidInvoices = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE')
  const unpaidAmount = unpaidInvoices.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Monthly Hours',
            value: formatHours(monthlyHours),
            icon: <Clock className="w-4 h-4 text-blue-400" />,
          },
          {
            label: 'Monthly Revenue',
            value: formatCurrency(monthlyRevenue),
            icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
          },
          {
            label: 'Total Billable',
            value: formatHours(totalBillableHours),
            icon: <Clock className="w-4 h-4 text-gold" />,
          },
          {
            label: 'Unpaid Invoices',
            value: formatCurrency(unpaidAmount),
            icon: <DollarSign className="w-4 h-4 text-orange-400" />,
            highlight: unpaidAmount > 0,
          },
        ].map(stat => (
          <div
            key={stat.label}
            className={cn(
              'bg-card border rounded p-3',
              stat.highlight ? 'border-orange-400/30' : 'border-border'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">{stat.icon}
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-xl font-data font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {(['time', 'invoices'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px',
              activeTab === tab
                ? 'border-gold text-gold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'time' ? 'Time Entries' : 'Invoices'}
          </button>
        ))}
      </div>

      {/* Time Entries */}
      {activeTab === 'time' && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Date', 'Case', 'Description', 'Hours', 'Rate', 'Amount', 'Status'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeEntries.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-muted/20 transition-colors',
                    i % 2 === 0 ? '' : 'bg-muted/10'
                  )}
                >
                  <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">
                    {formatLA(entry.date, 'MMM d')}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/cases/${entry.case.id}`}
                      className="text-[12px] text-gold hover:text-gold/80 font-data"
                    >
                      {entry.case.caseNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-foreground max-w-[200px] truncate">
                    {entry.description}
                  </td>
                  <td className="px-3 py-2 text-[12px] font-data text-foreground">
                    {formatHours(entry.hours)}
                  </td>
                  <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">
                    ${entry.rate}/h
                  </td>
                  <td className="px-3 py-2 text-[12px] font-data font-bold text-foreground">
                    {formatCurrency(entry.hours * entry.rate)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded',
                      entry.qbSynced
                        ? 'text-emerald-400 bg-emerald-400/10'
                        : entry.billable
                        ? 'text-blue-400 bg-blue-400/10'
                        : 'text-slate-500 bg-slate-500/10'
                    )}>
                      {entry.qbSynced ? 'QB Synced' : entry.billable ? 'Billable' : 'N/B'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Case', 'Amount', 'Status', 'Issued', 'Due Date'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr
                  key={inv.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-muted/20 transition-colors',
                    i % 2 === 0 ? '' : 'bg-muted/10'
                  )}
                >
                  <td className="px-3 py-2">
                    <Link href={`/cases/${inv.case.id}`} className="text-[12px] text-gold hover:text-gold/80 font-data">
                      {inv.case.caseNumber}
                    </Link>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{inv.case.title}</p>
                  </td>
                  <td className="px-3 py-2 text-[13px] font-data font-bold text-foreground">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded', INVOICE_STATUS_COLORS[inv.status])}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">
                    {formatLA(inv.issuedAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">
                    {formatLA(inv.dueDate, 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
