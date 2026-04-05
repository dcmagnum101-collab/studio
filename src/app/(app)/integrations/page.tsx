import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { IntegrationsClient } from './integrations-client'

export const dynamic = 'force-dynamic'

async function getIntegrationData() {
  const syncHistory = await prisma.integrationSync.findMany({
    orderBy: { syncedAt: 'desc' },
    take: 20,
  })
  return { syncHistory }
}

export default async function IntegrationsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const { syncHistory } = await getIntegrationData()

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-base font-semibold text-white">Integrations</h1>
        <p className="text-[11px] text-slate-500 mt-0.5">Connect your tools and automate workflows</p>
      </div>
      <IntegrationsClient
        syncHistory={syncHistory.map(s => ({
          id: s.id,
          system: s.system,
          status: s.status,
          message: s.message,
          records: s.records,
          syncedAt: s.syncedAt.toISOString(),
        }))}
      />
    </div>
  )
}
