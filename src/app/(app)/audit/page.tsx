import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuditPageClient } from './audit-client'
import { Topbar } from '@/components/layout/topbar'

export const metadata = { title: 'AI Audit | Padda Legal Intelligence' }

async function getAuditData() {
  const [recentRuns, unresolvedFlags, criticalCount, highCount] = await Promise.all([
    prisma.auditRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true } },
        _count: { select: { flags: true } },
      },
    }),
    prisma.auditFlag.findMany({
      where: { isResolved: false },
      include: {
        case: { select: { id: true, caseNumber: true, title: true } },
      },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    }),
    prisma.auditFlag.count({ where: { isResolved: false, severity: 'CRITICAL' } }),
    prisma.auditFlag.count({ where: { isResolved: false, severity: 'HIGH' } }),
  ])

  return { recentRuns, unresolvedFlags, criticalCount, highCount }
}

export default async function AuditPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const data = await getAuditData()

  return (
    <div className="flex flex-col h-full">
      <Topbar title="AI Audit Engine" subtitle="Case health monitoring + risk intelligence" />
      <AuditPageClient
        recentRuns={JSON.parse(JSON.stringify(data.recentRuns))}
        unresolvedFlags={JSON.parse(JSON.stringify(data.unresolvedFlags))}
        criticalCount={data.criticalCount}
        highCount={data.highCount}
        userId={session.user?.id ?? ''}
      />
    </div>
  )
}
