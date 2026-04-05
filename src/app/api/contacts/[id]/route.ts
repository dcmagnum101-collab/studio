import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contact = await prisma.contact.findUnique({
    where: { id: params.id },
    include: {
      clientCases: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: { dateOpened: 'desc' },
      },
      caseContacts: {
        include: { case: { select: { id: true, caseNumber: true, title: true, status: true } } },
      },
    },
  })

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(contact)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = updateContactSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const contact = await prisma.contact.update({
    where: { id: params.id },
    data: parsed.data,
  })

  return NextResponse.json(contact)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.contact.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
