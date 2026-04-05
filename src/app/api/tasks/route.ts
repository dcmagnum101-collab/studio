import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1),
  caseId: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  category: z.string(),
  assignedToId: z.string().optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const caseId = searchParams.get('caseId')

  const tasks = await prisma.task.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(caseId ? { caseId } : {}),
    },
    include: {
      case: { select: { id: true, caseNumber: true, title: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
  })

  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      caseId: parsed.data.caseId,
      description: parsed.data.description,
      dueDate: new Date(parsed.data.dueDate),
      priority: parsed.data.priority as never,
      category: parsed.data.category as never,
      assignedToId: parsed.data.assignedToId ?? session.user?.id ?? '',
    },
  })

  return NextResponse.json(task, { status: 201 })
}
