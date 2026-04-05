import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TasksTable } from './tasks-table'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getTasks() {
  return prisma.task.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: {
      case: { select: { id: true, caseNumber: true, title: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }],
  })
}

async function getUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export default async function TasksPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [tasks, users] = await Promise.all([getTasks(), getUsers()])

  const tableData = tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    caseId: t.case?.id ?? null,
    caseNumber: t.case?.caseNumber ?? null,
    caseTitle: t.case?.title ?? null,
    dueDate: t.dueDate.toISOString(),
    priority: t.priority,
    status: t.status,
    category: t.category,
    assignedToId: t.assignedTo.id,
    assignedToName: t.assignedTo.name,
    completedAt: t.completedAt?.toISOString() ?? null,
  }))

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-white">Tasks</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {tasks.filter(t => t.status !== 'COMPLETED').length} open tasks
          </p>
        </div>
      </div>

      <div className="bg-[#0D1421] border border-[#1a2332] rounded-lg overflow-hidden">
        <TasksTable data={tableData} users={users} />
      </div>
    </div>
  )
}
