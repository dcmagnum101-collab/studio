'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn, CASE_TYPE_LABELS, formatCurrency } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  Plus,
  X,
  Loader2,
  User,
  Briefcase,
  Users,
  ClipboardList,
  Sparkles,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  type: string
  company: string | null
}

interface StaffUser {
  id: string
  name: string
  role: string
  email: string
}

interface GeneratedTask {
  title: string
  category: string
  daysFromOpen: number
  priority: string
  dueDate: string
}

// ─── Step Indicator ───────────────────────────────────────────

const STEPS = [
  { label: 'Case Info', icon: Briefcase },
  { label: 'Client', icon: User },
  { label: 'Parties', icon: Users },
  { label: 'Assign & Tasks', icon: ClipboardList },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  done
                    ? 'bg-gold text-navy'
                    : active
                    ? 'bg-gold/20 border-2 border-gold text-gold'
                    : 'bg-muted border border-border text-muted-foreground'
                )}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium tracking-wide whitespace-nowrap',
                  active ? 'text-gold' : done ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-12 sm:w-20 mx-1 mb-5 transition-all',
                  i < current ? 'bg-gold' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Contact Search/Create ────────────────────────────────────

function ContactSearch({
  label,
  contactType,
  selected,
  onSelect,
  onCreate,
}: {
  label: string
  contactType: string
  selected: Contact | null
  onSelect: (c: Contact) => void
  onCreate: (c: Partial<Contact>) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newFirst, setNewFirst] = useState('')
  const [newLast, setNewLast] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts?search=${encodeURIComponent(q)}&type=${contactType}`)
      const data = await res.json()
      setResults(data)
    } finally {
      setLoading(false)
    }
  }, [contactType])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  if (selected) {
    return (
      <div className="flex items-center justify-between p-3 bg-card border border-border rounded">
        <div>
          <p className="text-sm font-medium text-foreground">
            {selected.firstName} {selected.lastName}
          </p>
          <p className="text-[11px] text-muted-foreground">{selected.email ?? selected.phone}</p>
        </div>
        <button
          onClick={() => onSelect(null as unknown as Contact)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="w-full pl-8 pr-3 py-2 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
        />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground animate-spin" />}
      </div>

      {results.length > 0 && (
        <div className="border border-border rounded bg-card divide-y divide-border max-h-40 overflow-y-auto">
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelect(c); setQuery(''); setResults([]) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <span className="font-medium text-foreground">{c.firstName} {c.lastName}</span>
              <span className="text-muted-foreground ml-2 text-xs">{c.email ?? c.phone}</span>
            </button>
          ))}
        </div>
      )}

      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Create new {label.toLowerCase()}
        </button>
      ) : (
        <div className="border border-border rounded p-3 bg-card space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">New {label}</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="First name *"
              value={newFirst}
              onChange={e => setNewFirst(e.target.value)}
              className="px-2.5 py-1.5 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
            <input
              placeholder="Last name *"
              value={newLast}
              onChange={e => setNewLast(e.target.value)}
              className="px-2.5 py-1.5 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>
          <input
            placeholder="Email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
          <input
            placeholder="Phone"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (newFirst && newLast) {
                  onCreate({ firstName: newFirst, lastName: newLast, email: newEmail || undefined, phone: newPhone || undefined })
                  setShowCreate(false)
                }
              }}
              className="px-3 py-1 bg-gold text-navy text-xs font-bold rounded hover:bg-gold/90 transition-colors"
            >
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────

export default function NewCasePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [generatingTasks, setGeneratingTasks] = useState(false)

  // Step 1: Case Info
  const [caseType, setCaseType] = useState('')
  const [subType, setSubType] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [statuteDate, setStatuteDate] = useState('')
  const [description, setDescription] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [priority, setPriority] = useState('MEDIUM')

  // Step 2: Client
  const [client, setClient] = useState<Contact | null>(null)

  // Step 3: Parties
  const [opposingCounsel, setOpposingCounsel] = useState<Contact | null>(null)
  const [adjuster, setAdjuster] = useState<Contact | null>(null)
  const [medicalProvider, setMedicalProvider] = useState<Contact | null>(null)

  // Step 4: Assignment + Tasks
  const [assignedToId, setAssignedToId] = useState('')
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())

  // Load staff on mount
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then((data: StaffUser[]) => {
        setStaff(data)
        const attorney = data.find((u: StaffUser) => u.role === 'ATTORNEY' || u.role === 'ADMIN')
        if (attorney) setAssignedToId(attorney.id)
      })
      .catch(() => {})
  }, [])

  // Auto-compute SOL date when incident date + case type changes
  useEffect(() => {
    if (!incidentDate) return
    const date = new Date(incidentDate)
    // Nevada PI SOL: 2 years for most; 3 for medical malpractice
    const yearsToAdd = caseType === 'MEDICAL_MALPRACTICE' ? 3 : 2
    date.setFullYear(date.getFullYear() + yearsToAdd)
    setStatuteDate(date.toISOString().split('T')[0])
  }, [incidentDate, caseType])

  async function createContact(data: Partial<Contact>, type: string): Promise<Contact | null> {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type }),
      })
      if (res.ok) return res.json()
    } catch {}
    return null
  }

  async function generateTasks() {
    setGeneratingTasks(true)
    try {
      const res = await fetch('/api/cases/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseType, incidentDate }),
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedTasks(data.tasks)
        setSelectedTasks(new Set(data.tasks.map((_: GeneratedTask, i: number) => i)))
      }
    } finally {
      setGeneratingTasks(false)
    }
  }

  async function handleNext() {
    if (step === 0) {
      if (!caseType || !incidentDate || !statuteDate) return
      setStep(1)
    } else if (step === 1) {
      if (!client) return
      setStep(2)
    } else if (step === 2) {
      setStep(3)
      if (generatedTasks.length === 0) generateTasks()
    } else if (step === 3) {
      await handleSubmit()
    }
  }

  async function handleSubmit() {
    if (!client || !caseType || !incidentDate || !statuteDate || !assignedToId) return
    setSubmitting(true)

    try {
      // Build case title
      const typeLabel = CASE_TYPE_LABELS[caseType] ?? caseType
      const title = `${client.firstName} ${client.lastName} — ${typeLabel}`

      // Gather additional contacts for step 3 party data
      const additionalContacts: { contactId: string; role: string }[] = []
      if (opposingCounsel) additionalContacts.push({ contactId: opposingCounsel.id, role: 'OPPOSING_COUNSEL' })
      if (adjuster) additionalContacts.push({ contactId: adjuster.id, role: 'ADJUSTER' })
      if (medicalProvider) additionalContacts.push({ contactId: medicalProvider.id, role: 'MEDICAL_PROVIDER' })

      const selectedTaskList = generatedTasks.filter((_, i) => selectedTasks.has(i))

      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type: caseType,
          subType: subType || undefined,
          clientId: client.id,
          assignedToId,
          incidentDate,
          statute: statuteDate,
          description: description || undefined,
          estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
          priority,
          additionalContacts,
          tasks: selectedTaskList,
        }),
      })

      if (res.ok) {
        const newCase = await res.json()
        router.push(`/cases/${newCase.id}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const step1Valid = caseType && incidentDate && statuteDate
  const step2Valid = !!client
  const canProceed =
    (step === 0 && step1Valid) ||
    (step === 1 && step2Valid) ||
    step === 2 ||
    (step === 3 && assignedToId)

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => (step === 0 ? router.push('/cases') : setStep(step - 1))}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {step === 0 ? 'Back to Cases' : 'Previous Step'}
        </button>

        <h1 className="text-lg font-bold text-foreground mb-1">New Case</h1>
        <p className="text-xs text-muted-foreground mb-6">
          Complete all steps to open a new matter in the system.
        </p>

        <StepIndicator current={step} />

        {/* ── Step 1: Case Info ── */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Case Type & Incident</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Case Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CASE_TYPE_LABELS).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setCaseType(val)}
                      className={cn(
                        'px-2 py-2 rounded border text-xs font-medium transition-all text-left',
                        caseType === val
                          ? 'bg-gold/10 border-gold text-gold'
                          : 'bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Incident Date *
                </label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={e => setIncidentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-2.5 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  SOL Deadline *
                </label>
                <input
                  type="date"
                  value={statuteDate}
                  onChange={e => setStatuteDate(e.target.value)}
                  className="w-full px-2.5 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
                {incidentDate && statuteDate && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Auto-computed from incident date (NV statute)
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full px-2.5 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                >
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Est. Case Value
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-sm text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={estimatedValue}
                    onChange={e => setEstimatedValue(e.target.value)}
                    placeholder="0"
                    className="w-full pl-6 pr-2.5 py-2 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>
                {estimatedValue && (
                  <p className="text-[10px] text-gold mt-1">{formatCurrency(parseFloat(estimatedValue))}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Case Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the incident and injuries..."
                  rows={3}
                  className="w-full px-2.5 py-2 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Client ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Client Information</h2>
            <p className="text-xs text-muted-foreground">
              Search for an existing client or create a new contact record.
            </p>

            <ContactSearch
              label="Client"
              contactType="CLIENT"
              selected={client}
              onSelect={c => setClient(c)}
              onCreate={async data => {
                const created = await createContact(data, 'CLIENT')
                if (created) setClient(created)
              }}
            />

            {client && (
              <div className="bg-gold/5 border border-gold/20 rounded p-3 space-y-1">
                <p className="text-xs font-bold text-gold uppercase tracking-wider">Selected Client</p>
                <p className="text-sm font-medium text-foreground">{client.firstName} {client.lastName}</p>
                {client.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
                {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Opposing Parties ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground">Opposing Parties & Insurance</h2>
            <p className="text-xs text-muted-foreground">
              All fields optional — you can add parties later from the case detail page.
            </p>

            <ContactSearch
              label="Opposing Counsel"
              contactType="OPPOSING_COUNSEL"
              selected={opposingCounsel}
              onSelect={setOpposingCounsel}
              onCreate={async data => {
                const created = await createContact(data, 'OPPOSING_COUNSEL')
                if (created) setOpposingCounsel(created)
              }}
            />

            <ContactSearch
              label="Insurance Adjuster"
              contactType="ADJUSTER"
              selected={adjuster}
              onSelect={setAdjuster}
              onCreate={async data => {
                const created = await createContact(data, 'ADJUSTER')
                if (created) setAdjuster(created)
              }}
            />

            <ContactSearch
              label="Medical Provider"
              contactType="MEDICAL_PROVIDER"
              selected={medicalProvider}
              onSelect={setMedicalProvider}
              onCreate={async data => {
                const created = await createContact(data, 'MEDICAL_PROVIDER')
                if (created) setMedicalProvider(created)
              }}
            />
          </div>
        )}

        {/* ── Step 4: Assignment + Tasks ── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground">Assignment & Initial Tasks</h2>

            {/* Attorney assignment */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Assign To *
              </label>
              <select
                value={assignedToId}
                onChange={e => setAssignedToId(e.target.value)}
                className="w-full px-2.5 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
              >
                <option value="">Select attorney / staff...</option>
                {staff.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* AI-generated tasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Initial Task List
                </label>
                <button
                  onClick={generateTasks}
                  disabled={generatingTasks}
                  className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 transition-colors disabled:opacity-50"
                >
                  {generatingTasks ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {generatingTasks ? 'Generating...' : 'Regenerate'}
                </button>
              </div>

              {generatingTasks && (
                <div className="flex items-center gap-2 p-4 bg-card border border-border rounded">
                  <Loader2 className="w-4 h-4 text-gold animate-spin" />
                  <p className="text-xs text-muted-foreground">
                    AI is generating tasks for {CASE_TYPE_LABELS[caseType]} case...
                  </p>
                </div>
              )}

              {!generatingTasks && generatedTasks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Select tasks to create automatically ({selectedTasks.size} of {generatedTasks.length} selected)
                  </p>
                  {generatedTasks.map((task, i) => (
                    <label
                      key={i}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-all',
                        selectedTasks.has(i)
                          ? 'bg-card border-gold/30'
                          : 'bg-card border-border opacity-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(i)}
                        onChange={e => {
                          const next = new Set(selectedTasks)
                          e.target.checked ? next.add(i) : next.delete(i)
                          setSelectedTasks(next)
                        }}
                        className="accent-gold"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Due in {task.daysFromOpen}d · {task.category.replace('_', ' ')}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          task.priority === 'CRITICAL'
                            ? 'text-red-400 bg-red-400/10'
                            : task.priority === 'HIGH'
                            ? 'text-orange-400 bg-orange-400/10'
                            : 'text-blue-400 bg-blue-400/10'
                        )}
                      >
                        {task.priority}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          <button
            onClick={() => (step === 0 ? router.push('/cases') : setStep(step - 1))}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-muted transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed || submitting}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded transition-all',
              canProceed && !submitting
                ? 'bg-gold text-navy hover:bg-gold/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Case...
              </>
            ) : step === 3 ? (
              <>
                <Check className="w-4 h-4" />
                Create Case
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
