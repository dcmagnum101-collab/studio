import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { CompetitorsClient } from './competitors-client'

export const metadata = { title: 'Competitor Intelligence | Padda Legal Intelligence' }

async function getCompetitorData() {
  const [competitors, recentAlerts] = await Promise.all([
    prisma.competitor.findMany({
      include: {
        _count: { select: { tactics: true, alerts: true } },
        alerts: { where: { isRead: false }, take: 3, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { reclaimScore: 'desc' },
    }),
    prisma.competitorAlert.findMany({
      where: { isRead: false },
      include: { competitor: { select: { name: true, firm: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return { competitors, recentAlerts }
}

export default async function CompetitorsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const data = await getCompetitorData()

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Competitor Intelligence" subtitle="Track competitor activity and identify opportunities" />
      <CompetitorsClient
        competitors={JSON.parse(JSON.stringify(data.competitors))}
        recentAlerts={JSON.parse(JSON.stringify(data.recentAlerts))}
      />
    </div>
  )
}
