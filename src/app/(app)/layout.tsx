import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { TimerProvider } from '@/contexts/timer-context'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TimerProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar title="Padda Legal Intelligence" />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TimerProvider>
  )
}
