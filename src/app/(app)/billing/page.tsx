import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { BillingClient } from './billing-client'
import { startOfMonth, endOfMonth } from 'date-fns'

export const metadata = { title: 'Time & Billing | Padda Legal Intelligence' }

async function getBillingData() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [timeEntries, invoices, monthlyTotals] = await Promise.all([
    prisma.timeEntry.findMany({
      include: {
        case: { select: { id: true, caseNumber: true, title: true } },
        user: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    }),
    prisma.invoice.findMany({
      include: {
        case: { select: { id: true, caseNumber: true, title: true } },
      },
      orderBy: { issuedAt: 'desc' },
    }),
    prisma.timeEntry.aggregate({
      where: { date: { gte: monthStart, lte: monthEnd }, billable: true },
      _sum: { hours: true },
    }),
  ])

  const monthlyRevenue = timeEntries
    .filter(e => e.billable && e.date >= monthStart && e.date <= monthEnd)
    .reduce((sum, e) => sum + e.hours * e.rate, 0)

  return { timeEntries, invoices, monthlyHours: monthlyTotals._sum.hours ?? 0, monthlyRevenue }
}

export default async function BillingPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const data = await getBillingData()

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Time & Billing" subtitle="Track billable hours and client invoices" />
      <BillingClient
        timeEntries={JSON.parse(JSON.stringify(data.timeEntries))}
        invoices={JSON.parse(JSON.stringify(data.invoices))}
        monthlyHours={data.monthlyHours}
        monthlyRevenue={data.monthlyRevenue}
      />
    </div>
  )
}
