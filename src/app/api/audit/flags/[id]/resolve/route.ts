import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function resolveFlag(params: { id: string }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.auditFlag.update({
    where: { id: params.id },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy: session.user?.id ?? '',
    },
  })

  return NextResponse.json({ success: true })
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return resolveFlag(params)
}

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  return resolveFlag(params)
}
