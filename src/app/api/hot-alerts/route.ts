import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { sendNurtureEmail } from '@/app/actions/gmail';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview Hot Alerts Cron Endpoint.
 * Scans for high-urgency deals and triggers multi-channel notifications.
 * Triggered every 2 hours via external cron.
 */

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAgoTs = admin.firestore.Timestamp.fromDate(twoHoursAgo);

    const userRef = adminDb.collection('users').doc(userId);
    const alertsTriggered = [];

    // 1. Check for new high ICP leads (90+)
    const hotLeadsSnap = await userRef.collection('contacts')
      .where('icpScore', '>=', 90)
      .where('created_at', '>=', twoHoursAgoTs)
      .get();

    for (const doc of hotLeadsSnap.docs) {
      const lead = doc.data();
      alertsTriggered.push(triggerAlert(userId, {
        title: '🔥 High-Value Prospect Detected',
        message: `${lead.name} has a 90+ ICP score. Immediate outreach recommended for ${lead.propertyAddress}.`,
        type: 'icp',
        leadId: doc.id
      }));
    }

    // 2. Check for unread SMS in last 2 hours
    const unreadSMSSnap = await userRef.collection('contacts')
      .where('unreadSMSCount', '>', 0)
      .where('updated_at', '>=', twoHoursAgoTs)
      .get();

    for (const doc of unreadSMSSnap.docs) {
      const lead = doc.data();
      alertsTriggered.push(triggerAlert(userId, {
        title: '💬 New Inbound Message',
        message: `New message from ${lead.name}. Don't leave the conversation cold.`,
        type: 'sms',
        leadId: doc.id
      }));
    }

    // 3. Check for Overdue Urgent Tasks
    const overdueTasksSnap = await userRef.collection('tasks')
      .where('status', '==', 'pending')
      .where('priority', '==', 'urgent')
      .where('due_date', '<=', now.toISOString())
      .get();

    for (const doc of overdueTasksSnap.docs) {
      const task = doc.data();
      alertsTriggered.push(triggerAlert(userId, {
        title: '⚠️ Urgent Task Overdue',
        message: `Task "${task.title}" for ${task.contact_name} is overdue. Strike now.`,
        type: 'task',
        leadId: task.contactId
      }));
    }

    await Promise.all(alertsTriggered);

    return NextResponse.json({ 
      success: true, 
      alertsCount: alertsTriggered.length 
    });

  } catch (error: any) {
    console.error('[Hot Alerts API] Critical failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function triggerAlert(userId: string, payload: {
  title: string;
  message: string;
  type: 'sms' | 'icp' | 'task';
  leadId: string;
}) {
  const alertRef = adminDb.collection('users').doc(userId).collection('alerts').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  // 1. Create Alert Record
  await alertRef.set({
    ...payload,
    read: false,
    created_at: timestamp
  });

  // 2. Create High-Priority Task
  await adminDb.collection('users').doc(userId).collection('tasks').add({
    title: payload.title,
    description: payload.message,
    contactId: payload.leadId,
    priority: 'urgent',
    status: 'pending',
    due_date: new Date().toISOString(),
    type: 'follow_up',
    ownerId: userId,
    created_at: timestamp
  });

  // 3. Send Email Notification
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userEmail = userDoc.data()?.email;

  if (userEmail) {
    await sendNurtureEmail({
      userId,
      contactId: payload.leadId,
      to: userEmail,
      subject: `MONICA HOT ALERT: ${payload.title}`,
      body: `
        <div style="font-family: sans-serif; padding: 20px; border: 4px solid #D4AF37; border-radius: 15px;">
          <h2 style="color: #0F172A;">${payload.title}</h2>
          <p style="font-size: 16px; color: #334155;">${payload.message}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/contacts/${payload.leadId}" 
             style="display: inline-block; background: #0F172A; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
             View Lead Strategy
          </a>
        </div>
      `
    }).catch(err => console.error('[Alerts] Email failed:', err));
  }
}
