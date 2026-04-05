'use client'

import { useState, useRef, useEffect } from 'react'
import { useTimer } from '@/contexts/timer-context'
import { cn, formatHours } from '@/lib/utils'
import { Play, Square, X, Check, Loader2, Clock, Search, ChevronDown } from 'lucide-react'

interface CaseOption {
  id: string
  caseNumber: string
  title: string
}

export function TimerWidget() {
  const { running, elapsed, displayTime, caseId, caseNumber, description, start, stop, reset, setDescription, setCaseRef } =
    useTimer()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [caseSearch, setCaseSearch] = useState('')
  const [cases, setCases] = useState<CaseOption[]>([])
  const [loadingCases, setLoadingCases] = useState(false)
  const [showCaseSelector, setShowCaseSelector] = useState(false)
  const [localDesc, setLocalDesc] = useState(description)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close panel when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Sync local desc when panel opens
  useEffect(() => {
    if (open) setLocalDesc(description)
  }, [open, description])

  async function searchCases(q: string) {
    if (!q.trim()) { setCases([]); return }
    setLoadingCases(true)
    try {
      const res = await fetch(`/api/cases?search=${encodeURIComponent(q)}`)
      const data = await res.json()
      setCases(Array.isArray(data) ? data.slice(0, 8) : [])
    } finally {
      setLoadingCases(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => searchCases(caseSearch), 300)
    return () => clearTimeout(timer)
  }, [caseSearch])

  async function handleLog() {
    if (elapsed < 60) return // min 1 minute
    setSaving(true)
    try {
      setDescription(localDesc)
      const hours = elapsed / 3600
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseId || null,
          hours,
          description: localDesc || 'Time tracked via timer',
          date: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        setSaved(true)
        reset()
        setTimeout(() => { setSaved(false); setOpen(false) }, 1500)
      }
    } finally {
      setSaving(false)
    }
  }

  const hoursDisplay = formatHours(elapsed / 3600)
  const isRunning = running

  return (
    <div className="relative" ref={panelRef}>
      {/* Timer button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-data font-medium transition-all',
          isRunning
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
            : elapsed > 0
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
            : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
        )}
      >
        <Clock className={cn('w-3 h-3', isRunning && 'animate-pulse')} />
        <span className="font-mono">{elapsed > 0 ? displayTime : '00:00'}</span>
        {caseNumber && (
          <span className="text-[10px] opacity-70 hidden sm:inline">{caseNumber}</span>
        )}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className={cn(
            'px-4 py-3 border-b border-border',
            isRunning ? 'bg-emerald-500/5' : 'bg-card'
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isRunning ? 'Timer Running' : elapsed > 0 ? 'Timer Paused' : 'Time Tracker'}
              </span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className={cn(
              'text-3xl font-mono font-bold tracking-wider',
              isRunning ? 'text-emerald-400' : elapsed > 0 ? 'text-amber-400' : 'text-muted-foreground'
            )}>
              {displayTime}
            </p>
            {elapsed > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{hoursDisplay} billable</p>
            )}
          </div>

          <div className="p-3 space-y-3">
            {/* Case selector */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Case
              </label>
              {caseId && caseNumber ? (
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted border border-border rounded">
                  <span className="text-xs text-foreground font-data">{caseNumber}</span>
                  <button
                    onClick={() => setCaseRef('', '')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : showCaseSelector ? (
                <div className="space-y-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 w-3 h-3 text-muted-foreground" />
                    <input
                      autoFocus
                      type="text"
                      value={caseSearch}
                      onChange={e => setCaseSearch(e.target.value)}
                      placeholder="Search cases..."
                      className="w-full pl-6 pr-2 py-1.5 bg-muted border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                    />
                    {loadingCases && <Loader2 className="absolute right-2 top-2 w-3 h-3 animate-spin text-muted-foreground" />}
                  </div>
                  {cases.length > 0 && (
                    <div className="border border-border rounded bg-card divide-y divide-border max-h-32 overflow-y-auto">
                      {cases.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setCaseRef(c.id, c.caseNumber)
                            setCaseSearch('')
                            setCases([])
                            setShowCaseSelector(false)
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-muted transition-colors"
                        >
                          <span className="text-xs font-data text-gold">{c.caseNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2 truncate">{c.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowCaseSelector(true)}
                  className="w-full text-left px-2.5 py-1.5 bg-muted border border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-gold/30 transition-all"
                >
                  Select a case (optional)
                </button>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={localDesc}
                onChange={e => setLocalDesc(e.target.value)}
                onBlur={() => setDescription(localDesc)}
                placeholder="What are you working on?"
                className="w-full px-2.5 py-1.5 bg-muted border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
            </div>

            {/* Controls */}
            <div className="flex gap-2 pt-1">
              {!isRunning ? (
                <button
                  onClick={() => start()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded text-xs font-bold transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  {elapsed > 0 ? 'Resume' : 'Start'}
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded text-xs font-bold transition-all"
                >
                  <Square className="w-3.5 h-3.5" />
                  Pause
                </button>
              )}

              {elapsed >= 60 && !isRunning && (
                <button
                  onClick={handleLog}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 rounded text-xs font-bold transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                  {saved ? 'Saved!' : 'Log Time'}
                </button>
              )}

              {elapsed > 0 && !isRunning && (
                <button
                  onClick={reset}
                  className="px-2.5 py-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/5 rounded text-xs transition-all border border-border"
                  title="Discard"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {elapsed > 0 && elapsed < 60 && !isRunning && (
              <p className="text-[10px] text-muted-foreground text-center">
                Track at least 1 minute to log
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
