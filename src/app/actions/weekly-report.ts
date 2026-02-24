'use server';

/**
 * @fileOverview Strategic Weekly Performance Reporting Service.
 * Aggregates CRM activity and uses Grok-4 to generate narrative insights.
 */

import { grokJSON } from '@/services/grok-service';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import type { WeeklyReport } from '@/lib/weekly-report-types';

/**
 * Generates a performance report based on the last 7 days of activity.
 */
export async function generateWeeklyReport(userId: string, weekStart: string): Promise<WeeklyReport> {
  const startDate = new Date(weekStart);
  const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);

  // 1. Fetch New Leads Added This Week
  const contactsSnap = await adminDb.collection('users').doc(userId).collection('contacts')
    .where('created_at', '>=', startTimestamp)
    .get();
  
  const newLeads = contactsSnap.docs.map(d => d.data());
  const leadTypeBreakdown: Record<string, number> = {};
  newLeads.forEach(l => {
    const src = l.archagent_source || 'unknown';
    leadTypeBreakdown[src] = (leadTypeBreakdown[src] || 0) + 1;
  });

  // 2. Fetch Activity from contacts modified this week
  const activeContactsSnap = await adminDb.collection('users').doc(userId).collection('contacts')
    .where('updated_at', '>=', startTimestamp)
    .get();

  let callCount = 0;
  let emailCount = 0;
  let warmMoves = 0;
  let deadLeads = 0;

  for (const doc of activeContactsSnap.docs) {
    const data = doc.data();
    // Count status moves
    if (['closed', 'listed', 'appointment_set', 'conversation_had'].includes(data.pipeline_stage)) warmMoves++;
    if (['dead', 'dnc'].includes(data.pipeline_stage)) deadLeads++;

    // Fetch logs for this week
    const logsSnap = await doc.ref.collection('activityLogs')
      .where('date', '>=', weekStart)
      .get();
    
    logsSnap.forEach(l => {
      const log = l.data();
      if (log.type === 'call') callCount++;
      if (log.type === 'email') emailCount++;
    });
  }

  // 3. Fetch Appointments scheduled this week
  const apptsSnap = await adminDb.collection('users').doc(userId).collection('appointments')
    .where('date', '>=', weekStart)
    .get();
  
  const appointmentsCount = apptsSnap.size;

  const system = `You are Monica Selvaggio's executive performance analyst. 
  Review the weekly real estate activity stats and provide a narrative summary and tactical recommendations.
  Focus on the Las Vegas residential market. Be direct, encouraging, and highly tactical.
  
  Return ONLY valid JSON:
  {
    "headline": string,
    "stats": {
      "calls": number,
      "emails": number,
      "new_leads": number,
      "appointments": number,
      "warm_moves": number,
      "dead_leads": number
    },
    "what_worked": string[],
    "what_to_improve": string[],
    "next_week_focus": string,
    "lead_type_breakdown": Record<string, number>
  }`;

  const userPrompt = `
  REPORT START: ${weekStart}
  DATA:
  - New Leads: ${newLeads.length}
  - Total Calls: ${callCount}
  - Total Emails: ${emailCount}
  - Appointments Set: ${appointmentsCount}
  - Pipeline Progressions: ${warmMoves}
  - Leads Lost: ${deadLeads}
  - Source Breakdown: ${JSON.stringify(leadTypeBreakdown)}
  `;

  try {
    const report = await grokJSON<WeeklyReport>(system, userPrompt, userId);

    // Cache the report for quick retrieval
    await adminDb.collection('users').doc(userId).collection('weekly_reports').doc(weekStart).set({
      ...report,
      generated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return report;
  } catch (error) {
    console.error('[Weekly Report] Generation failed:', error);
    throw new Error('Monica could not synthesize the weekly report. Check Grok API.');
  }
}

/**
 * Sends the weekly report to Monica's connected Gmail.
 */
export async function sendReportToUser(userId: string, report: WeeklyReport) {
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userData = userDoc.data();
  const userEmail = userData?.email 
    || process.env.GMAIL_USER 
    || 'monicaselvaggio@gmail.com';

  const tokenDoc = await adminDb.collection('users').doc(userId).collection('integrations').doc('gmail').get();
  if (!tokenDoc.exists) throw new Error('Gmail not connected');
  const { accessToken } = tokenDoc.data()!;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; color: #1e293b;">
      <h1 style="color: #1e3a8a;">Weekly Performance: ${report.headline}</h1>
      <p style="font-size: 16px; line-height: 1.6;">${report.next_week_focus}</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f8fafc;">
          <th style="padding: 10px; border: 1px solid #e2e8f0;">New Leads</th>
          <th style="padding: 10px; border: 1px solid #e2e8f0;">Calls</th>
          <th style="padding: 10px; border: 1px solid #e2e8f0;">Appts</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${report.stats.new_leads}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${report.stats.calls}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${report.stats.appointments}</td>
        </tr>
      </table>

      <h3 style="color: #1e3a8a;">What Worked</h3>
      <ul>${report.what_worked.map(w => `<li>${w}</li>`).join('')}</ul>

      <h3 style="color: #1e3a8a;">Focus for Next Week</h3>
      <p>${report.next_week_focus}</p>
      
      <p style="font-size: 12px; color: #64748b; margin-top: 40px;">
        Sent from Monica AI Hub Executive Intelligence.
      </p>
    </div>
  `;

  const subject = `Weekly Performance: ${report.headline}`;
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${userEmail}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    html,
  ];
  
  const rawMessage = Buffer.from(messageParts.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawMessage }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gmail Send Error: ${err.error?.message || 'Unknown'}`);
  }

  return { success: true };
}
