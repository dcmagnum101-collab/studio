import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { triggerAlert } from '@/lib/communications/alerts'
import type { AlertPayload } from '@/lib/communications/alerts'
import { z } from 'zod'

const schema = z.object({
  alertType: z.enum([
    'SOL_CRITICAL',
    'SOL_WARNING',
    'CASE_STALLED',
    'MISSING_CRITICAL_DOC',
    'HIGH_VALUE_STALLED',
    'COURT_DATE_APPROACHING',
  ]),
  caseId: z.string().optional(),
  taskId: z.string().optional(),
  caseNumber: z.string().optional(),
  caseTitle: z.string().optional(),
  clientName: z.string().optional(),
  caseStage: z.string().optional(),
  contextMessage: z.string(),
  flagType: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const result = await triggerAlert(parsed.data as AlertPayload)
  return NextResponse.json(result)
}
