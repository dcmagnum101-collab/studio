import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateCaseNumber } from '@/lib/utils'

const createCaseSchema = z.object({
  title: z.string().min(1),
  type: z.string(),
  clientId: z.string(),
  incidentDate: z.string(),
  statute: z.string(),
  description: z.string().optional(),
  estimatedValue: z.number().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  subType: z.string().optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const stage = searchParams.get('stage')

  const cases = await prisma.case.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(type ? { type: type as never } : {}),
      ...(stage ? { stage: stage as never } : {}),
    },
    include: {
      client: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { tasks: true, documents: true, auditFlags: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(cases)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createCaseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const newCase = await prisma.case.create({
    data: {
      caseNumber: generateCaseNumber(),
      title: parsed.data.title,
      type: parsed.data.type as never,
      clientId: parsed.data.clientId,
      incidentDate: new Date(parsed.data.incidentDate),
      statute: new Date(parsed.data.statute),
      description: parsed.data.description,
      estimatedValue: parsed.data.estimatedValue,
      priority: (parsed.data.priority ?? 'MEDIUM') as never,
      subType: parsed.data.subType,
      assignedToId: session.user.id,
    },
  })

  return NextResponse.json(newCase, { status: 201 })
}
