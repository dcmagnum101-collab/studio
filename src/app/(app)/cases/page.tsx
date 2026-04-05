import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CasesTable } from './cases-table'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCases() {
  return prisma.case.findMany({
    where: { status: { not: 'ARCHIVED' } },
    include: {
      client: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: [{ priority: 'asc' }, { statute: 'asc' }],
  })
}

export default async function CasesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const cases = await getCases()

  const tableData = cases.map(c => ({
    id: c.id,
    caseNumber: c.caseNumber,
    title: c.title,
    client: `${c.client.firstName} ${c.client.lastName}`,
    type: c.type,
    stage: c.stage,
    status: c.status,
    priority: c.priority,
    statute: c.statute.toISOString(),
    assignedTo: c.assignedTo.name,
    estimatedValue: c.estimatedValue ?? 0,
    dateOpened: c.dateOpened.toISOString(),
  }))

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-white">Cases</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">{cases.length} active cases</p>
        </div>
        <Link
          href="/cases/new"
          className="flex items-center gap-1.5 bg-[#C9A84C] hover:bg-[#b8953e] text-[#0A1628] font-semibold text-xs px-3 py-1.5 rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Case
        </Link>
      </div>

      <div className="bg-[#0D1421] border border-[#1a2332] rounded-lg overflow-hidden">
        <CasesTable data={tableData} />
      </div>
    </div>
  )
}
