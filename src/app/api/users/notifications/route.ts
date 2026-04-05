import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  notifyMorning: z.boolean().optional(),
  notifyNightly: z.boolean().optional(),
  notifyAlerts: z.boolean().optional(),
  notifySMS: z.boolean().optional(),
})

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  await prisma.user.update({
    where: { id: session.user?.id ?? '' },
    data: parsed.data,
  })

  return NextResponse.json({ success: true })
}
