import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { INITIAL_TASK_TEMPLATES } from '@/lib/audit/constants'
import { addDays, format } from 'date-fns'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { caseType, incidentDate } = body

  const templates = INITIAL_TASK_TEMPLATES[caseType] ?? INITIAL_TASK_TEMPLATES['DEFAULT']
  const openDate = new Date()

  const tasks = templates.map(t => ({
    title: t.title,
    category: t.category,
    priority: t.priority,
    daysFromOpen: t.daysFromOpen,
    dueDate: format(addDays(openDate, t.daysFromOpen), 'yyyy-MM-dd'),
  }))

  // Supplement with any incident-date-specific tasks
  if (incidentDate) {
    const incident = new Date(incidentDate)
    const daysSinceIncident = Math.floor((Date.now() - incident.getTime()) / 86400000)
    if (daysSinceIncident < 3) {
      const emergency = {
        title: 'Preserve all accident scene evidence immediately',
        category: 'INTERNAL',
        priority: 'CRITICAL',
        daysFromOpen: 1,
        dueDate: format(addDays(openDate, 1), 'yyyy-MM-dd'),
      }
      // Add to front if not already covered
      if (!tasks.some(t => t.category === 'INTERNAL' && t.priority === 'CRITICAL')) {
        tasks.unshift(emergency)
      }
    }
  }

  return NextResponse.json({ tasks })
}
