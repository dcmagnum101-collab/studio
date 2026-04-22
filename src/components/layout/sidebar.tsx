'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CheckSquare,
  FileText,
  Clock,
  Brain,
  Trophy,
  Settings,
  Zap,
  ChevronRight,
  Scale,
  LogOut,
  BarChart3,
  X,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useSidebar } from '@/contexts/sidebar-context'

const NAV_SECTIONS = [
  {
    label: 'CORE',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/cases', label: 'Cases', icon: Briefcase },
      { href: '/contacts', label: 'Contacts', icon: Users },
      { href: '/tasks', label: 'Tasks', icon: CheckSquare },
      { href: '/documents', label: 'Documents', icon: FileText },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { href: '/billing', label: 'Time & Billing', icon: Clock },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { href: '/audit', label: 'AI Audit', icon: Brain },
      { href: '/competitors', label: 'Competitors', icon: Trophy },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { href: '/integrations', label: 'Integrations', icon: Zap },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#111827]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gold flex items-center justify-center flex-shrink-0">
            <Scale className="w-4 h-4 text-[#0A1628]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gold tracking-widest uppercase leading-none">PPL</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-none">Legal Intelligence</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-200 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-5 overflow-y-auto">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="px-2 mb-1 text-[9px] font-bold text-slate-600 tracking-widest uppercase">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] transition-all group',
                        active
                          ? 'bg-gold/10 text-gold font-medium'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-3.5 h-3.5 shrink-0 transition-colors',
                          active ? 'text-gold' : 'text-slate-500 group-hover:text-slate-300'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 ml-auto text-gold/60 shrink-0" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 border-t border-[#111827] pt-3">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all w-full"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { open, close } = useSidebar()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-56 bg-[#060E1B] border-r border-[#111827] transition-transform duration-200 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onClose={close} />
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 h-screen bg-[#060E1B] border-r border-[#111827] overflow-y-auto">
        <SidebarContent />
      </aside>
    </>
  )
}
