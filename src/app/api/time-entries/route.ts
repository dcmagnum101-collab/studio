import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  caseId: z.string().nullable().optional(),
  hours: z.number().min(0.01).max(24),
  description: z.string().optional(),
  billable: z.boolean().optional().default(true),
  date: z.string().optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const caseId = searchParams.get('caseId')
  const userId = searchParams.get('userId')

  const entries = await prisma.timeEntry.findMany({
    where: {
      ...(caseId ? { caseId } : {}),
      ...(userId ? { userId } : { userId: session.user?.id ?? '' }),
    },
    include: {
      case: { select: { caseNumber: true, title: true } },
      user: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: 100,
  })

  return NextResponse.json(entries)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const { caseId, hours, description, billable, date } = parsed.data

  const entry = await prisma.timeEntry.create({
    data: {
      caseId: caseId || null,
      userId: session.user?.id ?? '',
      hours,
      description: description ?? '',
      billable: billable ?? true,
      date: date ? new Date(date) : new Date(),
    },
    include: {
      case: { select: { caseNumber: true, title: true } },
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
