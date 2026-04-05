import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

  const logs = await prisma.communicationLog.findMany({
    where: { type: 'HIGH_ALERT' },
    orderBy: { sentAt: 'desc' },
    take: limit,
  })

  return NextResponse.json(logs)
}
