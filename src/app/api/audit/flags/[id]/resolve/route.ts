import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  return POST(_req, { params })
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.auditFlag.update({
    where: { id: params.id },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy: session.user.id,
    },
  })

  return NextResponse.json({ success: true })
}
