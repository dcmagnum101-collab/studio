import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-guard'
import { prisma } from '@/lib/prisma'
import { sendSMSAlert, sendCriticalVoiceAlert } from '@/lib/integrations/twilio'
import { resend } from '@/lib/integrations/resend'
import SolWarningEmail from '../../../../../emails/sol-warning'
import * as React from 'react'
import { daysUntil } from '@/lib/utils'
import { addDays } from 'date-fns'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const sol48h = addDays(now, 2)
    const sol7 = addDays(now, 7)
    const sol30 = addDays(now, 30)

    // Get all cases with SOL < 30 days
    const solCases = await prisma.case.findMany({
      where: {
        status: 'ACTIVE',
        statute: { lte: sol30 },
      },
      include: {
        client: true,
        documents: {
          where: { category: 'DEMAND_LETTER' },
          take: 1,
        },
      },
      orderBy: { statute: 'asc' },
    })

    if (solCases.length === 0) {
      return NextResponse.json({ success: true, message: 'No SOL warnings' })
    }

    const critical = solCases.filter(c => daysUntil(c.statute) <= 7)
    const urgent48h = solCases.filter(c => daysUntil(c.statute) <= 2)

    // Voice call for cases within 48h with no demand letter
    for (const c of urgent48h) {
      if (c.documents.length === 0 && process.env.PAUL_PADDA_PHONE) {
        const message = `Critical statute of limitations alert for case ${c.caseNumber}, ${c.title}. This case expires in ${daysUntil(c.statute)} days and no demand letter has been filed. Immediate action required.`
        await sendCriticalVoiceAlert(process.env.PAUL_PADDA_PHONE, message).catch(console.error)
      }
    }

    // SMS for critical cases (< 7 days)
    if (critical.length > 0 && process.env.PAUL_PADDA_PHONE) {
      const criticalMsg = `CRITICAL: ${critical.length} case${critical.length > 1 ? 's' : ''} with SOL < 7 days:\n${critical
        .map(c => `${c.caseNumber}: ${daysUntil(c.statute)}d`)
        .join('\n')}`
      await sendSMSAlert(process.env.PAUL_PADDA_PHONE, criticalMsg).catch(console.error)
    }

    // Email to all users with alerts enabled
    const alertUsers = await prisma.user.findMany({
      where: { isActive: true, notifyAlerts: true },
      select: { email: true },
    })

    if (alertUsers.length > 0) {
      const emailCases = solCases.map(c => ({
        caseId: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        clientName: `${c.client.firstName} ${c.client.lastName}`,
        daysLeft: daysUntil(c.statute),
        solDate: c.statute.toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        }),
        stage: c.stage,
        estimatedValue: c.estimatedValue ?? undefined,
      }))

      await resend.emails.send({
        from: process.env.RESEND_ALERT_EMAIL ?? 'alerts@paddalaw.ai',
        to: alertUsers.map(u => u.email),
        subject: `⚠️ SOL Alert: ${critical.length} critical, ${solCases.length} total cases require attention`,
        react: React.createElement(SolWarningEmail, {
          cases: emailCases,
          generatedAt: now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
        }),
      })
    }

    // Log to CommunicationLog
    await prisma.communicationLog.create({
      data: {
        type: 'SOL_ALERT',
        recipient: alertUsers.map(u => u.email).join(', '),
        subject: `SOL Monitor — ${solCases.length} cases`,
        status: 'sent',
        metadata: {
          totalCases: solCases.length,
          criticalCases: critical.length,
          voiceCallsSent: urgent48h.filter(c => c.documents.length === 0).length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      casesMonitored: solCases.length,
      criticalCases: critical.length,
      voiceCallsSent: urgent48h.filter(c => c.documents.length === 0).length,
    })
  } catch (err) {
    console.error('[cron/sol-monitor] Error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
