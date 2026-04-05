import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { sendSMSAlert, sendCriticalVoiceAlert } from '@/lib/integrations/twilio'
import { resend } from '@/lib/integrations/resend'
import { daysUntil } from '@/lib/utils'
import { addHours } from 'date-fns'
import * as React from 'react'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Alert condition types ────────────────────────────────────

export type AlertType =
  | 'SOL_CRITICAL'
  | 'SOL_WARNING'
  | 'CASE_STALLED'
  | 'MISSING_CRITICAL_DOC'
  | 'HIGH_VALUE_STALLED'
  | 'COURT_DATE_APPROACHING'

export type AlertChannel = 'EMAIL' | 'SMS' | 'VOICE'

export const ALERT_CONDITIONS: Record<
  AlertType,
  {
    severity: 'CRITICAL' | 'HIGH'
    channels: AlertChannel[]
    throttleHours: number
    label: string
  }
> = {
  SOL_CRITICAL: {
    severity: 'CRITICAL',
    channels: ['EMAIL', 'SMS', 'VOICE'],
    throttleHours: 24,
    label: 'SOL Critical (<7 days)',
  },
  SOL_WARNING: {
    severity: 'HIGH',
    channels: ['EMAIL', 'SMS'],
    throttleHours: 72,
    label: 'SOL Warning (<30 days)',
  },
  CASE_STALLED: {
    severity: 'HIGH',
    channels: ['EMAIL'],
    throttleHours: 24,
    label: 'Case Stalled (72h no activity, HIGH priority)',
  },
  MISSING_CRITICAL_DOC: {
    severity: 'HIGH',
    channels: ['EMAIL', 'SMS'],
    throttleHours: 48,
    label: 'Missing Critical Document',
  },
  HIGH_VALUE_STALLED: {
    severity: 'CRITICAL',
    channels: ['EMAIL', 'SMS', 'VOICE'],
    throttleHours: 24,
    label: 'High-Value Case Stalled (>$500k, 48h no activity)',
  },
  COURT_DATE_APPROACHING: {
    severity: 'HIGH',
    channels: ['EMAIL', 'SMS'],
    throttleHours: 24,
    label: 'Court Date <48 Hours',
  },
}

// ─── Throttle check ───────────────────────────────────────────

async function isThrottled(
  alertType: AlertType,
  channel: AlertChannel,
  caseId?: string,
  taskId?: string
): Promise<boolean> {
  const existing = await prisma.alertThrottle.findFirst({
    where: {
      alertType,
      channel,
      ...(caseId ? { caseId } : {}),
      ...(taskId ? { taskId } : {}),
      expiresAt: { gt: new Date() },
    },
  })
  return !!existing
}

async function recordThrottle(
  alertType: AlertType,
  channel: AlertChannel,
  throttleHours: number,
  caseId?: string,
  taskId?: string
): Promise<void> {
  await prisma.alertThrottle.create({
    data: {
      alertType,
      channel,
      caseId,
      taskId,
      expiresAt: addHours(new Date(), throttleHours),
    },
  })
}

// ─── AI recommendation ────────────────────────────────────────

async function getAIRecommendation(
  alertType: AlertType,
  caseNumber: string,
  caseTitle: string,
  context: string
): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 120,
      messages: [
        {
          role: 'user',
          content: `You are a legal AI for Paul Padda Law. Give a 1-2 sentence specific action recommendation for this alert.
Alert: ${ALERT_CONDITIONS[alertType].label}
Case: ${caseNumber} — ${caseTitle}
Context: ${context}
Response: only the recommendation sentence(s), no preamble.`,
        },
      ],
    })
    return (msg.content[0] as { text: string }).text
  } catch {
    return 'Review this case immediately and take appropriate action.'
  }
}

// ─── Core alert trigger ───────────────────────────────────────

export interface AlertPayload {
  alertType: AlertType
  caseId?: string
  taskId?: string
  caseNumber?: string
  caseTitle?: string
  clientName?: string
  caseStage?: string
  caseTypeLabel?: string
  contextMessage: string
  flagType?: string
}

export async function triggerAlert(payload: AlertPayload): Promise<{
  sent: string[]
  skipped: string[]
}> {
  const condition = ALERT_CONDITIONS[payload.alertType]
  const sent: string[] = []
  const skipped: string[] = []

  // Get all users with alert notifications enabled
  const alertUsers = await prisma.user.findMany({
    where: { isActive: true, notifyAlerts: true },
    select: { email: true, phone: true, notifySMS: true },
  })

  const recommendation = await getAIRecommendation(
    payload.alertType,
    payload.caseNumber ?? '',
    payload.caseTitle ?? '',
    payload.contextMessage
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://padda-legal.vercel.app'

  // ── EMAIL ───────────────────────────────────────────────────
  if (condition.channels.includes('EMAIL')) {
    const emailThrottled = await isThrottled(
      payload.alertType,
      'EMAIL',
      payload.caseId,
      payload.taskId
    )

    if (emailThrottled) {
      skipped.push('EMAIL (throttled)')
    } else {
      const HighAlertEmail = (await import('../../../emails/high-alert')).default
      const toAddresses = alertUsers.map(u => u.email)

      if (toAddresses.length > 0) {
        const { error } = await resend.emails.send({
          from: process.env.RESEND_ALERT_EMAIL ?? 'alerts@paddalaw.ai',
          to: toAddresses,
          subject: `[${condition.severity}] ${ALERT_CONDITIONS[payload.alertType].label} — ${payload.caseNumber ?? ''}`,
          react: React.createElement(HighAlertEmail, {
            caseNumber: payload.caseNumber ?? '',
            caseTitle: payload.caseTitle ?? '',
            caseId: payload.caseId ?? '',
            clientName: payload.clientName ?? '',
            severity: condition.severity,
            flagType: payload.flagType ?? payload.alertType,
            title: ALERT_CONDITIONS[payload.alertType].label,
            description: payload.contextMessage,
            recommendation,
            urgency: condition.severity === 'CRITICAL' ? 'IMMEDIATE' : 'THIS_WEEK',
            triggeredAt: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
          }),
        })

        if (!error) {
          await recordThrottle(
            payload.alertType,
            'EMAIL',
            condition.throttleHours,
            payload.caseId,
            payload.taskId
          )
          sent.push('EMAIL')
        }
      }
    }
  }

  // ── SMS ─────────────────────────────────────────────────────
  if (condition.channels.includes('SMS')) {
    const smsThrottled = await isThrottled(
      payload.alertType,
      'SMS',
      payload.caseId,
      payload.taskId
    )

    if (smsThrottled) {
      skipped.push('SMS (throttled)')
    } else {
      const smsMsg = `${condition.severity}: ${ALERT_CONDITIONS[payload.alertType].label}\n${payload.caseNumber ?? ''}: ${payload.contextMessage}\n${recommendation}\n${appUrl}/cases/${payload.caseId}`
      const smsTargets = alertUsers.filter(u => u.notifySMS && u.phone)

      // Always alert Paul
      if (process.env.PAUL_PADDA_PHONE) {
        smsTargets.push({ email: '', phone: process.env.PAUL_PADDA_PHONE, notifySMS: true })
      }

      const uniquePhones = [...new Set(smsTargets.map(u => u.phone).filter(Boolean))]
      for (const phone of uniquePhones) {
        await sendSMSAlert(phone!, smsMsg).catch(console.error)
      }

      await recordThrottle(
        payload.alertType,
        'SMS',
        condition.throttleHours,
        payload.caseId,
        payload.taskId
      )
      sent.push('SMS')
    }
  }

  // ── VOICE ────────────────────────────────────────────────────
  if (condition.channels.includes('VOICE')) {
    const voiceThrottled = await isThrottled(
      payload.alertType,
      'VOICE',
      payload.caseId,
      payload.taskId
    )

    if (voiceThrottled) {
      skipped.push('VOICE (throttled)')
    } else if (process.env.PAUL_PADDA_PHONE) {
      const voiceMsg = `Critical legal alert for Paul Padda Law. ${payload.contextMessage} Case number ${payload.caseNumber}. ${recommendation}`
      await sendCriticalVoiceAlert(process.env.PAUL_PADDA_PHONE, voiceMsg).catch(console.error)

      await recordThrottle(
        payload.alertType,
        'VOICE',
        condition.throttleHours,
        payload.caseId,
        payload.taskId
      )
      sent.push('VOICE')
    }
  }

  // Log to CommunicationLog
  await prisma.communicationLog.create({
    data: {
      type: 'HIGH_ALERT',
      recipient: alertUsers.map(u => u.email).join(', '),
      subject: `${condition.severity}: ${ALERT_CONDITIONS[payload.alertType].label}`,
      body: payload.contextMessage,
      status: sent.length > 0 ? 'sent' : 'throttled',
      metadata: {
        alertType: payload.alertType,
        caseId: payload.caseId,
        sent,
        skipped,
        recommendation,
      },
    },
  })

  return { sent, skipped }
}

// ─── Scan for alert conditions ────────────────────────────────

export async function scanAndFireAlerts(): Promise<number> {
  let fired = 0

  const activeCases = await prisma.case.findMany({
    where: { status: 'ACTIVE' },
    include: {
      client: true,
      documents: true,
      tasks: {
        where: {
          category: 'COURT_DATE',
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      },
      notes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  for (const c of activeCases) {
    const clientName = `${c.client.firstName} ${c.client.lastName}`
    const lastActivity = c.notes[0]?.createdAt ?? c.updatedAt
    const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / 3600000
    const solDays = daysUntil(c.statute)

    // SOL_CRITICAL
    if (solDays <= 7) {
      await triggerAlert({
        alertType: 'SOL_CRITICAL',
        caseId: c.id,
        caseNumber: c.caseNumber,
        caseTitle: c.title,
        clientName,
        caseStage: c.stage,
        contextMessage: `Statute of limitations expires in ${solDays} day${solDays !== 1 ? 's' : ''} on ${c.statute.toLocaleDateString()}.`,
      }).catch(console.error)
      fired++
    }
    // SOL_WARNING (30 days, skip if already CRITICAL)
    else if (solDays <= 30) {
      await triggerAlert({
        alertType: 'SOL_WARNING',
        caseId: c.id,
        caseNumber: c.caseNumber,
        caseTitle: c.title,
        clientName,
        caseStage: c.stage,
        contextMessage: `Statute of limitations expires in ${solDays} days on ${c.statute.toLocaleDateString()}.`,
      }).catch(console.error)
      fired++
    }

    // HIGH_VALUE_STALLED
    if ((c.estimatedValue ?? 0) > 500000 && hoursSinceActivity >= 48) {
      await triggerAlert({
        alertType: 'HIGH_VALUE_STALLED',
        caseId: c.id,
        caseNumber: c.caseNumber,
        caseTitle: c.title,
        clientName,
        caseStage: c.stage,
        contextMessage: `High-value case ($${c.estimatedValue?.toLocaleString()}) has had no activity in ${Math.round(hoursSinceActivity)} hours.`,
      }).catch(console.error)
      fired++
    }

    // CASE_STALLED (HIGH priority, 72h)
    if (c.priority === 'HIGH' && hoursSinceActivity >= 72) {
      await triggerAlert({
        alertType: 'CASE_STALLED',
        caseId: c.id,
        caseNumber: c.caseNumber,
        caseTitle: c.title,
        clientName,
        caseStage: c.stage,
        contextMessage: `HIGH priority case has had no recorded activity in ${Math.round(hoursSinceActivity)} hours.`,
      }).catch(console.error)
      fired++
    }

    // COURT_DATE_APPROACHING (<48h)
    for (const task of c.tasks) {
      const hoursUntilTask = (task.dueDate.getTime() - Date.now()) / 3600000
      if (hoursUntilTask > 0 && hoursUntilTask <= 48) {
        await triggerAlert({
          alertType: 'COURT_DATE_APPROACHING',
          caseId: c.id,
          taskId: task.id,
          caseNumber: c.caseNumber,
          caseTitle: c.title,
          clientName,
          caseStage: c.stage,
          contextMessage: `Court date "${task.title}" is in ${Math.round(hoursUntilTask)} hours on ${task.dueDate.toLocaleString()}.`,
        }).catch(console.error)
        fired++
      }
    }
  }

  return fired
}
