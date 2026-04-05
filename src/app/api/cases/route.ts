import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateCaseNumber } from '@/lib/utils'

const createCaseSchema = z.object({
  title: z.string().min(1),
  type: z.string(),
  clientId: z.string(),
  assignedToId: z.string().optional(),
  incidentDate: z.string(),
  statute: z.string(),
  description: z.string().optional(),
  estimatedValue: z.number().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  subType: z.string().optional(),
  additionalContacts: z.array(z.object({ contactId: z.string(), role: z.string() })).optional(),
  tasks: z.array(z.object({
    title: z.string(),
    category: z.string(),
    priority: z.string(),
    daysFromOpen: z.number(),
    dueDate: z.string(),
  })).optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const stage = searchParams.get('stage')
  const search = searchParams.get('search')

  const cases = await prisma.case.findMany({
    where: {
      ...(status ? { status: status as never } : { status: { not: 'ARCHIVED' as never } }),
      ...(type ? { type: type as never } : {}),
      ...(stage ? { stage: stage as never } : {}),
      ...(search ? {
        OR: [
          { caseNumber: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
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

  const { additionalContacts, tasks, assignedToId, ...caseData } = parsed.data

  const newCase = await prisma.case.create({
    data: {
      caseNumber: generateCaseNumber(),
      title: caseData.title,
      type: caseData.type as never,
      clientId: caseData.clientId,
      incidentDate: new Date(caseData.incidentDate),
      statute: new Date(caseData.statute),
      description: caseData.description,
      estimatedValue: caseData.estimatedValue,
      priority: (caseData.priority ?? 'MEDIUM') as never,
      subType: caseData.subType,
      assignedToId: assignedToId ?? session.user?.id ?? '',
    },
  })

  // Create additional case contacts (opposing counsel, adjuster, etc.)
  if (additionalContacts && additionalContacts.length > 0) {
    await prisma.caseContact.createMany({
      data: additionalContacts.map(c => ({
        caseId: newCase.id,
        contactId: c.contactId,
        role: c.role,
      })),
      skipDuplicates: true,
    })
  }

  // Create initial tasks from wizard
  if (tasks && tasks.length > 0) {
    await prisma.task.createMany({
      data: tasks.map(t => ({
        caseId: newCase.id,
        assignedToId: assignedToId ?? session.user?.id ?? '',
        title: t.title,
        category: t.category as never,
        priority: t.priority as never,
        dueDate: new Date(t.dueDate),
        status: 'TODO' as never,
      })),
    })
  }

  // Record initial stage history
  await prisma.stageHistory.create({
    data: {
      caseId: newCase.id,
      toStage: 'INTAKE',
      movedBy: session.user?.id ?? '',
      notes: 'Case opened',
    },
  })

  return NextResponse.json(newCase, { status: 201 })
}
