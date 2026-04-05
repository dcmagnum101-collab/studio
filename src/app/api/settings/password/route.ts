import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  current: z.string().min(1),
  next: z.string().min(8),
})

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: session.user?.id ?? '' },
    select: { password: true },
  })

  if (!user?.password) {
    return NextResponse.json(
      { error: 'No password set. Use Google sign-in to access this account.' },
      { status: 400 }
    )
  }

  const valid = await bcrypt.compare(parsed.data.current, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(parsed.data.next, 12)
  await prisma.user.update({
    where: { id: session.user?.id ?? '' },
    data: { password: hashed },
  })

  return NextResponse.json({ success: true })
}
