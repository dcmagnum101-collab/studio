import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-guard'
import {
  gatherMorningBriefingData,
  generateBriefingNarrative,
} from '@/lib/communications/morning-briefing'
import { prisma } from '@/lib/prisma'
import { sendMorningBriefingSMS } from '@/lib/integrations/twilio'
import { resend } from '@/lib/integrations/resend'
import MorningBriefingEmail from '../../../../../emails/morning-briefing'
import * as React from 'react'
import { formatCurrency } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await gatherMorningBriefingData()
    const narrative = await generateBriefingNarrative(data)

    const recipients = await prisma.user.findMany({
      where: { isActive: true, notifyMorning: true },
      select: { email: true, name: true, phone: true, notifySMS: true },
    })

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, message: 'No recipients configured' })
    }

    // Build email props
    const emailProps = {
      recipientName: 'Paul',
      date: data.date,
      narrative,
      priorityActions: data.todayTasks
        .filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH')
        .slice(0, 5),
      solWatchlist: data.solWarnings.map(s => ({
        caseNumber: s.caseNumber,
        title: s.title,
        clientName: '',
        daysLeft: s.daysLeft,
        caseId: '',
      })),
      pipeline: {
        activeCases: data.activeCases,
        pipelineValue: formatCurrency(data.highValuePipeline),
        settledThisMonth: data.settledThisMonth,
        newCasesThisWeek: data.newCasesThisWeek,
        overdueTaskCount: data.overdueTasks.length,
      },
      stalledCases: data.stalledCases.map(s => ({
        caseNumber: s.caseNumber,
        title: s.title,
        daysStalled: s.daysStalled,
        stage: '',
        caseId: '',
      })),
      todaysTasks: data.todayTasks.slice(0, 8),
    }

    const toAddresses = recipients.map(u => u.email)
    const subject = `Morning Briefing — ${data.date}${data.solWarnings.length > 0 ? ` ⚠️ ${data.solWarnings.length} SOL` : ''}`

    const { data: emailData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'briefings@paddalaw.ai',
      to: toAddresses,
      subject,
      react: React.createElement(MorningBriefingEmail, emailProps),
    })

    // SMS summary to users with notifySMS=true
    const smsUsers = recipients.filter(u => u.notifySMS && u.phone)
    const smsSummary = `${data.activeCases} active cases | ${data.todayTasks.length} tasks today | ${data.overdueTasks.length} overdue | ${data.solWarnings.length} SOL warnings`

    for (const user of smsUsers) {
      if (user.phone) {
        await sendMorningBriefingSMS(user.phone, smsSummary).catch(console.error)
      }
    }

    await prisma.communicationLog.create({
      data: {
        type: 'MORNING_BRIEFING',
        recipient: toAddresses.join(', '),
        subject,
        body: narrative,
        status: error ? 'failed' : 'sent',
        metadata: {
          activeCases: data.activeCases,
          solWarnings: data.solWarnings.length,
          todayTasks: data.todayTasks.length,
          smsCount: smsUsers.length,
          emailId: emailData?.id,
          error: error?.message,
        },
      },
    })

    return NextResponse.json({
      success: !error,
      recipients: toAddresses.length,
      smsCount: smsUsers.length,
      activeCases: data.activeCases,
      solWarnings: data.solWarnings.length,
    })
  } catch (err) {
    console.error('[cron/morning-briefing] Error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
