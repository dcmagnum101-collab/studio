import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { runFullAudit } from '@/lib/audit/engine'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { run, flagCount } = await runFullAudit(session.user?.id ?? '', 'MANUAL')
    return NextResponse.json({
      success: true,
      runId: run.id,
      casesScanned: run.casesScanned,
      flagsFound: flagCount,
      riskScore: run.riskScore,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
