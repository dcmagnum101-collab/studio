import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  assignedToId: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const updates: Record<string, unknown> = { ...parsed.data }

  if (parsed.data.dueDate) {
    updates.dueDate = new Date(parsed.data.dueDate)
  }

  if (parsed.data.status === 'COMPLETED') {
    updates.completedAt = new Date()
  }

  const task = await prisma.task.update({
    where: { id: params.id },
    data: updates as never,
  })

  return NextResponse.json(task)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.task.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  })

  return NextResponse.json({ success: true })
}
