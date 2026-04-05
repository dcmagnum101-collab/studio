'use client'

import { useState } from 'react'
import { cn, formatLA } from '@/lib/utils'
import { User, Bell, Users, Shield, Check } from 'lucide-react'

interface CurrentUser {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  notifyMorning: boolean
  notifyNightly: boolean
  notifyAlerts: boolean
  notifySMS: boolean
  image?: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

interface SettingsClientProps {
  currentUser: CurrentUser
  allUsers: TeamMember[]
  userRole: string
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-gold bg-gold/10',
  ATTORNEY: 'text-purple-400 bg-purple-400/10',
  PARALEGAL: 'text-blue-400 bg-blue-400/10',
  STAFF: 'text-slate-400 bg-slate-400/10',
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors shrink-0 ml-4',
          checked ? 'bg-gold' : 'bg-muted'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}

export function SettingsClient({ currentUser, allUsers, userRole }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'team' | 'security'>('profile')
  const [notifyMorning, setNotifyMorning] = useState(currentUser.notifyMorning)
  const [notifyNightly, setNotifyNightly] = useState(currentUser.notifyNightly)
  const [notifyAlerts, setNotifyAlerts] = useState(currentUser.notifyAlerts)
  const [notifySMS, setNotifySMS] = useState(currentUser.notifySMS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveNotifications() {
    setSaving(true)
    try {
      await fetch('/api/users/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyMorning, notifyNightly, notifyAlerts, notifySMS }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="max-w-2xl space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px',
                activeTab === tab.id
                  ? 'border-gold text-gold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-card border border-border rounded p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Profile Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: currentUser.name },
                { label: 'Email', value: currentUser.email },
                { label: 'Phone', value: currentUser.phone ?? '—' },
                { label: 'Role', value: currentUser.role },
              ].map(field => (
                <div key={field.label}>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{field.label}</p>
                  <p className="text-sm text-foreground">{field.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Contact your administrator to update profile information.
            </p>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-card border border-border rounded p-5 space-y-1">
            <h3 className="text-sm font-semibold text-foreground mb-3">Notification Preferences</h3>
            <Toggle
              checked={notifyMorning}
              onChange={setNotifyMorning}
              label="Morning Briefing"
              description="Daily AM digest at 7:00 AM PT (weekdays)"
            />
            <Toggle
              checked={notifyNightly}
              onChange={setNotifyNightly}
              label="Nightly Report"
              description="Daily PM summary at 6:00 PM PT (weekdays)"
            />
            <Toggle
              checked={notifyAlerts}
              onChange={setNotifyAlerts}
              label="High-Priority Alerts"
              description="Immediate email alerts for critical flags and SOL warnings"
            />
            <Toggle
              checked={notifySMS}
              onChange={setNotifySMS}
              label="SMS Alerts"
              description="Text message alerts for critical issues (requires phone number)"
            />
            <div className="pt-3">
              <button
                onClick={saveNotifications}
                disabled={saving}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all',
                  saved
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-gold text-navy hover:bg-gold/90'
                )}
              >
                {saved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Saved
                  </>
                ) : saving ? (
                  'Saving...'
                ) : (
                  'Save Preferences'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Team Members ({allUsers.length})</h3>
              {userRole === 'ADMIN' && (
                <button className="text-[11px] text-gold hover:text-gold/80 transition-colors">
                  + Invite User
                </button>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Name', 'Email', 'Role', 'Joined'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allUsers.map(member => (
                  <tr key={member.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-[10px] font-bold text-gold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[13px] text-foreground">{member.name}</span>
                        {member.id === currentUser.id && (
                          <span className="text-[10px] text-muted-foreground">(you)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[12px] text-muted-foreground">{member.email}</td>
                    <td className="px-3 py-2">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', ROLE_COLORS[member.role])}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[12px] font-data text-muted-foreground">
                      {formatLA(member.createdAt, 'MMM yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-card border border-border rounded p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
            <div className="space-y-3">
              {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
                <div key={label}>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">
                    {label}
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                    placeholder="••••••••"
                  />
                </div>
              ))}
              <button className="px-4 py-2 bg-gold text-navy text-sm font-bold rounded hover:bg-gold/90 transition-all">
                Update Password
              </button>
            </div>
            <div className="pt-2 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2">Active Sessions</h3>
              <p className="text-xs text-muted-foreground">
                Signed in as <span className="text-foreground">{currentUser.email}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
