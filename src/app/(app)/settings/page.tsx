import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { SettingsClient } from './settings-client'

export const metadata = { title: 'Settings | Padda Legal Intelligence' }

async function getSettingsData(userId: string) {
  const [currentUser, allUsers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        notifyMorning: true,
        notifyNightly: true,
        notifyAlerts: true,
        notifySMS: true,
        image: true,
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return { currentUser, allUsers }
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const data = await getSettingsData(session.user?.id ?? '')

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Settings" subtitle="Account, notifications, and team management" />
      <SettingsClient
        currentUser={JSON.parse(JSON.stringify(data.currentUser))}
        allUsers={JSON.parse(JSON.stringify(data.allUsers))}
        userRole={(session.user as { role?: string })?.role ?? 'STAFF'}
      />
    </div>
  )
}
