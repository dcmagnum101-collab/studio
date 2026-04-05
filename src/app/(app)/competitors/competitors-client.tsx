'use client'

import { useState } from 'react'
import { cn, formatLA } from '@/lib/utils'
import { Trophy, Star, TrendingUp, AlertTriangle, Plus, Brain, ExternalLink } from 'lucide-react'

interface Competitor {
  id: string
  name: string
  firm: string
  website?: string
  practiceAreas: string[]
  adPlatforms: string[]
  estimatedCases?: number
  avgSettlement?: number
  winRate?: number
  reviewCount?: number
  avgRating?: number
  reclaimScore?: number
  reclaimAnalysis?: string
  notes?: string
  tags: string[]
  _count: { tactics: number; alerts: number }
  alerts: Array<{ id: string; type: string; title: string; createdAt: string; isRead: boolean }>
}

interface CompetitorAlert {
  id: string
  type: string
  title: string
  description: string
  isRead: boolean
  createdAt: string
  competitor: { name: string; firm: string }
}

interface CompetitorsClientProps {
  competitors: Competitor[]
  recentAlerts: CompetitorAlert[]
}

function ReclaimScore({ score }: { score?: number }) {
  if (!score) return <span className="text-muted-foreground text-xs">—</span>
  const color = score >= 70 ? '#16A34A' : score >= 40 ? '#D97706' : '#DC2626'
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
      >
        {score}
      </div>
    </div>
  )
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn(
            'w-3 h-3',
            i <= Math.round(rating) ? 'fill-gold text-gold' : 'text-muted-foreground'
          )}
        />
      ))}
      <span className="text-[11px] text-muted-foreground ml-1 font-data">{rating.toFixed(1)}</span>
    </div>
  )
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  NEW_REVIEW: '⭐ Review',
  AD_CAMPAIGN: '📣 Ad',
  CASE_WIN: '✅ Win',
  CASE_LOSS: '❌ Loss',
  RATING_CHANGE: '📊 Rating',
  WEBSITE_CHANGE: '🌐 Website',
}

export function CompetitorsClient({ competitors, recentAlerts }: CompetitorsClientProps) {
  const [analyzing, setAnalyzing] = useState<string | null>(null)

  async function runAnalysis(competitorId: string) {
    setAnalyzing(competitorId)
    try {
      await fetch(`/api/competitors/${competitorId}/analyze`, { method: 'POST' })
      window.location.reload()
    } finally {
      setAnalyzing(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex gap-5">
        {/* Competitors grid */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {competitors.length} Competitors Tracked
            </p>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-navy text-xs font-bold rounded hover:bg-gold/90 transition-all">
              <Plus className="w-3.5 h-3.5" />
              Add Competitor
            </button>
          </div>

          {competitors.length === 0 ? (
            <div className="bg-card border border-border rounded p-8 text-center">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No competitors tracked yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Add competitors to monitor their activity.</p>
            </div>
          ) : (
            competitors.map(comp => (
              <div key={comp.id} className="bg-card border border-border rounded p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-foreground">{comp.name}</h3>
                      {comp.alerts.length > 0 && (
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">
                          {comp.alerts.length} new
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{comp.firm}</p>
                    {comp.practiceAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {comp.practiceAreas.slice(0, 4).map(area => (
                          <span key={area} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Reclaim</p>
                      <ReclaimScore score={comp.reclaimScore ?? undefined} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Rating</p>
                    <StarRating rating={comp.avgRating ?? undefined} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Reviews</p>
                    <p className="text-xs font-data font-medium text-foreground">{comp.reviewCount ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Est. Cases</p>
                    <p className="text-xs font-data font-medium text-foreground">{comp.estimatedCases ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Win Rate</p>
                    <p className="text-xs font-data font-medium text-foreground">
                      {comp.winRate ? `${comp.winRate}%` : '—'}
                    </p>
                  </div>
                </div>

                {comp.reclaimAnalysis && (
                  <div className="bg-muted/30 rounded p-2 text-[11px] text-muted-foreground line-clamp-2 italic">
                    {comp.reclaimAnalysis}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {comp.website && (
                    <a
                      href={comp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-gold transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </a>
                  )}
                  <button
                    onClick={() => runAnalysis(comp.id)}
                    disabled={analyzing === comp.id}
                    className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors ml-auto"
                  >
                    <Brain className="w-3 h-3" />
                    {analyzing === comp.id ? 'Analyzing...' : 'AI Analysis'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Alerts sidebar */}
        <div className="w-64 shrink-0 space-y-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Recent Alerts
          </p>
          {recentAlerts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No new alerts.</p>
          ) : (
            recentAlerts.map(alert => (
              <div key={alert.id} className="bg-card border border-border rounded p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-orange-400">
                    {ALERT_TYPE_LABELS[alert.type] ?? alert.type}
                  </span>
                  <span className="text-[10px] font-data text-muted-foreground">
                    {formatLA(alert.createdAt, 'MMM d')}
                  </span>
                </div>
                <p className="text-[12px] text-foreground font-medium">{alert.title}</p>
                <p className="text-[11px] text-muted-foreground">{alert.competitor.name}</p>
                {alert.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{alert.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
