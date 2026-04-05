import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLA(date: Date | string, fmt: string = 'MMM d, yyyy'): string {
  try {
    return format(new Date(date), fmt)
  } catch {
    return ''
  }
}

export const TIMEZONE = 'America/Los_Angeles'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function daysUntil(date: Date | string): number {
  return differenceInDays(new Date(date), new Date())
}

export function solUrgency(statute: Date | string): 'critical' | 'high' | 'medium' | 'low' {
  const days = daysUntil(statute)
  if (days <= 7) return 'critical'
  if (days <= 30) return 'high'
  if (days <= 90) return 'medium'
  return 'low'
}

export function generateCaseNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 90000) + 10000
  return `PPL-${year}-${random}`
}

export function normalizePhone(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return raw
}

export const PRIORITY_COLORS = {
  LOW: 'text-slate-400 bg-slate-400/10',
  MEDIUM: 'text-blue-400 bg-blue-400/10',
  HIGH: 'text-orange-400 bg-orange-400/10',
  CRITICAL: 'text-red-400 bg-red-400/10',
} as const

export const STAGE_LABELS: Record<string, string> = {
  INTAKE: 'Intake',
  INVESTIGATION: 'Investigation',
  DEMAND: 'Demand',
  NEGOTIATION: 'Negotiation',
  LITIGATION: 'Litigation',
  TRIAL: 'Trial',
  SETTLEMENT: 'Settlement',
  CLOSED: 'Closed',
}

export const CASE_TYPE_LABELS: Record<string, string> = {
  PERSONAL_INJURY: 'Personal Injury',
  AUTO_ACCIDENT: 'Auto Accident',
  SLIP_AND_FALL: 'Slip & Fall',
  WRONGFUL_DEATH: 'Wrongful Death',
  WORKERS_COMP: "Workers' Comp",
  MEDICAL_MALPRACTICE: 'Medical Malpractice',
  PRODUCT_LIABILITY: 'Product Liability',
  PREMISES_LIABILITY: 'Premises Liability',
  OTHER: 'Other',
}

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-emerald-400 bg-emerald-400/10',
  INACTIVE: 'text-slate-400 bg-slate-400/10',
  SETTLED: 'text-purple-400 bg-purple-400/10',
  CLOSED: 'text-slate-500 bg-slate-500/10',
  REFERRED: 'text-cyan-400 bg-cyan-400/10',
  ARCHIVED: 'text-slate-600 bg-slate-600/10',
}

export const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  MEDIUM: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  HIGH: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  CRITICAL: 'text-red-400 bg-red-400/10 border-red-400/20',
}
