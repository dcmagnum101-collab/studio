import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-guard'
import { gatherNightlyReportData, generateNightlyNarrative } from '@/lib/communications/nightly-report'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/integrations/resend'
import NightlyReportEmail from '../../../../../emails/nightly-report'
import * as React from 'react'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Gather data and generate narrative
    const data = await gatherNightlyReportData()
    const narrative = await generateNightlyNarrative(data)

    // Get recipients
    const recipients = await prisma.user.findMany({
      where: { isActive: true, notifyNightly: true },
      select: { email: true, name: true },
    })

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, message: 'No recipients configured' })
    }

    const toAddresses = recipients.map(u => u.email)
    const subject = `Nightly Report — ${data.date} · ${data.completedTasks.length} tasks completed`

    // Send email
    const { data: emailData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'briefings@paddalaw.ai',
      to: toAddresses,
      subject,
      react: React.createElement(NightlyReportEmail, { data, narrative }),
    })

    // Log communication
    await prisma.communicationLog.create({
      data: {
        type: 'NIGHTLY_REPORT',
        recipient: toAddresses.join(', '),
        subject,
        body: narrative,
        status: error ? 'failed' : 'sent',
        metadata: {
          completedTasks: data.completedTasks.length,
          stageChanges: data.stageChanges.length,
          dailyRevenue: data.timeEntries.dailyRevenue,
          solWarnings: data.solWarnings.length,
          emailId: emailData?.id,
          error: error?.message,
        },
      },
    })

    return NextResponse.json({
      success: !error,
      recipients: toAddresses.length,
      completedTasks: data.completedTasks.length,
      stageChanges: data.stageChanges.length,
      dailyRevenue: data.timeEntries.dailyRevenue,
    })
  } catch (err) {
    console.error('[cron/nightly-report] Error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
