'use client'

import { Bell, Search, User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { formatLA } from '@/lib/utils'
import { TimerWidget } from './timer-widget'

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { data: session } = useSession()

  return (
    <header className="flex items-center justify-between h-12 px-5 border-b border-border bg-card/40 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-semibold text-foreground leading-none">{title}</h1>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground font-data hidden lg:block">
          {formatLA(new Date(), 'EEE, MMM d · h:mm a')} PT
        </span>

        <TimerWidget />

        <div className="flex items-center gap-1 ml-1">
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Search className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Bell className="w-3.5 h-3.5" />
          </button>
          <div className="w-7 h-7 flex items-center justify-center rounded bg-gold/10 text-gold">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? ''}
                className="w-7 h-7 rounded object-cover"
              />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
