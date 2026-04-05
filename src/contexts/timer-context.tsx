'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'

interface TimerState {
  running: boolean
  startedAt: number | null // ms epoch
  elapsed: number // seconds
  caseId: string | null
  caseNumber: string | null
  description: string
}

interface TimerContextValue extends TimerState {
  start: (caseId?: string, caseNumber?: string) => void
  stop: () => void
  reset: () => void
  setDescription: (d: string) => void
  setCaseRef: (id: string, number: string) => void
  displayTime: string
}

const TimerContext = createContext<TimerContextValue | null>(null)

const STORAGE_KEY = 'ppl_timer_state'

function formatDisplayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState>({
    running: false,
    startedAt: null,
    elapsed: 0,
    caseId: null,
    caseNumber: null,
    description: '',
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as TimerState
        if (parsed.running && parsed.startedAt) {
          // Recalculate elapsed since page was closed
          const extraSeconds = Math.floor((Date.now() - parsed.startedAt) / 1000)
          setState({ ...parsed, elapsed: extraSeconds })
        } else {
          setState(parsed)
        }
      }
    } catch {}
  }, [])

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  // Tick interval
  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({ ...prev, elapsed: prev.elapsed + 1 }))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.running])

  const start = useCallback((caseId?: string, caseNumber?: string) => {
    setState(prev => ({
      ...prev,
      running: true,
      startedAt: Date.now() - prev.elapsed * 1000,
      caseId: caseId ?? prev.caseId,
      caseNumber: caseNumber ?? prev.caseNumber,
    }))
  }, [])

  const stop = useCallback(() => {
    setState(prev => ({ ...prev, running: false }))
  }, [])

  const reset = useCallback(() => {
    setState({
      running: false,
      startedAt: null,
      elapsed: 0,
      caseId: null,
      caseNumber: null,
      description: '',
    })
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  const setDescription = useCallback((d: string) => {
    setState(prev => ({ ...prev, description: d }))
  }, [])

  const setCaseRef = useCallback((id: string, number: string) => {
    setState(prev => ({ ...prev, caseId: id, caseNumber: number }))
  }, [])

  const displayTime = formatDisplayTime(state.elapsed)

  return (
    <TimerContext.Provider value={{ ...state, start, stop, reset, setDescription, setCaseRef, displayTime }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within TimerProvider')
  return ctx
}
