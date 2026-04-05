import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-guard'
import { runFullAudit } from '@/lib/audit/engine'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find or create a system user for scheduled audits
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@paddalaw.ai' },
    })

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          name: 'System',
          email: 'system@paddalaw.ai',
          role: 'ADMIN',
          isActive: true,
        },
      })
    }

    const { run, flagCount } = await runFullAudit(systemUser.id, 'SCHEDULED')

    return NextResponse.json({
      success: true,
      runId: run.id,
      casesScanned: run.casesScanned,
      flagsFound: flagCount,
      riskScore: run.riskScore,
    })
  } catch (err) {
    console.error('[cron/audit-sweep] Error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
