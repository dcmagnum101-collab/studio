import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export function verifyZapierSecret(request: Request): boolean {
  const secret = request.headers.get('x-zapier-secret')
  return secret === process.env.ZAPIER_WEBHOOK_SECRET
}

export type ZapierEventType =
  | 'stage_changed'
  | 'high_value_settled'
  | 'new_client'
  | 'critical_audit_flag'

export interface ZapierOutboundEvent {
  type: ZapierEventType
  timestamp: string
  data: Record<string, unknown>
}

export async function fireZapierEvent(
  type: ZapierEventType,
  data: Record<string, unknown>
): Promise<void> {
  const webhookUrl = process.env.ZAPIER_OUTBOUND_WEBHOOK_URL
  if (!webhookUrl) return

  const event: ZapierOutboundEvent = {
    type,
    timestamp: new Date().toISOString(),
    data,
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Padda-Signature': crypto
          .createHmac('sha256', process.env.ZAPIER_WEBHOOK_SECRET ?? '')
          .update(JSON.stringify(event))
          .digest('hex'),
      },
      body: JSON.stringify(event),
    })
  } catch (err) {
    console.error('Zapier outbound webhook failed:', err)
  }
}

export interface ZapierInboundPayload {
  type: 'new_lead' | 'new_case'
  payload: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    caseType?: string
    incidentDate?: string
    description?: string
    source?: string
  }
}

export async function processInboundWebhook(data: ZapierInboundPayload) {
  if (data.type === 'new_lead') {
    // Create a contact and notify
    const contact = await prisma.contact.create({
      data: {
        type: 'CLIENT',
        firstName: data.payload.firstName ?? 'Unknown',
        lastName: data.payload.lastName ?? '',
        email: data.payload.email,
        phone: data.payload.phone,
        notes: `Inbound lead from Zapier. Source: ${data.payload.source ?? 'unknown'}`,
      },
    })
    return { action: 'contact_created', id: contact.id }
  }

  return { action: 'ignored', reason: 'Unknown type' }
}
