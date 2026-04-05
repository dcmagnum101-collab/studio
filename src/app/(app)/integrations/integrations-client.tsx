'use client'

import { useState } from 'react'
import { cn, formatLA } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Zap, FileText, Calendar, Phone, Book } from 'lucide-react'

interface SyncRecord {
  id: string
  system: string
  status: string
  message: string | null
  records: number
  syncedAt: string
}

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  envKey: string
  connected: boolean
  lastSynced?: string
  syncPath?: string
}

const INTEGRATIONS: Omit<Integration, 'connected' | 'lastSynced'>[] = [
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Sync time entries, invoices, and financial data',
    icon: <Book className="w-5 h-5" />,
    envKey: 'QUICKBOOKS_ACCESS_TOKEN',
    syncPath: '/api/cron/integration-sync',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync court dates, deadlines, and appointments',
    icon: <Calendar className="w-5 h-5" />,
    envKey: 'GOOGLE_CALENDAR_ID',
    syncPath: '/api/cron/integration-sync',
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    description: 'Electronic signatures for retainers and settlement docs',
    icon: <FileText className="w-5 h-5" />,
    envKey: 'DOCUSIGN_ACCOUNT_ID',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS alerts, client notifications, and call tracking',
    icon: <Phone className="w-5 h-5" />,
    envKey: 'TWILIO_ACCOUNT_SID',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows with 5,000+ apps',
    icon: <Zap className="w-5 h-5" />,
    envKey: 'ZAPIER_WEBHOOK_SECRET',
  },
]

const CONNECTED_IDS = new Set(['quickbooks', 'twilio', 'docusign'])

export function IntegrationsClient({ syncHistory }: { syncHistory: SyncRecord[] }) {
  const [syncing, setSyncing] = useState<string | null>(null)

  async function triggerSync(integrationId: string) {
    setSyncing(integrationId)
    try {
      await fetch('/api/cron/integration-sync', {
        method: 'GET',
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` },
      })
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Integration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {INTEGRATIONS.map(integration => {
          const connected = CONNECTED_IDS.has(integration.id)
          const lastSync = syncHistory.find(s => s.system.toLowerCase().includes(integration.id))

          return (
            <div
              key={integration.id}
              className={cn(
                'bg-[#0D1421] border rounded-lg p-4 transition-colors',
                connected ? 'border-[#1a2332]' : 'border-[#111827] opacity-70'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    connected ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'bg-[#1a2332] text-slate-600'
                  )}
                >
                  {integration.icon}
                </div>
                <Badge variant={connected ? 'success' : 'muted'}>
                  {connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {integration.description}
              </p>

              {lastSync && (
                <p className="text-[10px] text-slate-600 mt-2 font-data">
                  Last sync: {formatLA(lastSync.syncedAt, 'MMM d, h:mm a')} ·{' '}
                  {lastSync.records} records
                </p>
              )}

              <div className="flex gap-2 mt-3">
                {connected ? (
                  <button
                    onClick={() => triggerSync(integration.id)}
                    disabled={syncing === integration.id}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#C9A84C] border border-[#1a2332] hover:border-[#C9A84C]/30 px-2.5 py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn('w-3 h-3', syncing === integration.id && 'animate-spin')} />
                    Sync Now
                  </button>
                ) : (
                  <button className="text-[11px] text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/10 px-2.5 py-1.5 rounded transition-colors">
                    Connect
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sync History */}
      <div className="bg-[#0D1421] border border-[#1a2332] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a2332]">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Sync History</h2>
        </div>
        {syncHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No sync history yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#111827]">
                {['System', 'Status', 'Records', 'Message', 'Time'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {syncHistory.map(record => (
                <tr key={record.id} className="border-b border-[#111827] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-3 py-2 text-xs text-white font-medium">{record.system}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {record.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : record.status === 'ERROR' ? (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                      )}
                      <span className={cn(
                        'text-xs',
                        record.status === 'SUCCESS' ? 'text-emerald-400' :
                        record.status === 'ERROR' ? 'text-red-400' : 'text-yellow-400'
                      )}>
                        {record.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs font-data text-slate-400">{record.records}</td>
                  <td className="px-3 py-2 text-[11px] text-slate-500 max-w-[200px] truncate">
                    {record.message ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-[11px] font-data text-slate-500">
                    {formatLA(record.syncedAt, 'MMM d, h:mm a')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
