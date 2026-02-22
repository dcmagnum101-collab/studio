
'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Sends a nurture email via Gmail API and logs it to CRM.
 */
export async function sendNurtureEmail(payload: {
  userId: string;
  contactId: string;
  to: string;
  subject: string;
  body: string;
  isAiGenerated?: boolean;
}) {
  const { userId, contactId, to, subject, body } = payload;

  // 1. Load Tokens
  const tokenDoc = await adminDb.collection('users').doc(userId).collection('integrations').doc('gmail').get();
  if (!tokenDoc.exists) throw new Error('Gmail not connected');
  const { accessToken } = tokenDoc.data()!;

  // 2. Artificial Delay (Simulate human behavior if enabled)
  // In a real server action, we'd queue this to a background job to avoid timeouts.
  // For MVP, we'll process immediately but log the intent.

  // 3. Construct RFC 2822 Message
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    body,
  ];
  const rawMessage = Buffer.from(messageParts.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 4. Send via Gmail API
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawMessage }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gmail API error: ${error.error?.message || 'Unknown failure'}`);
  }

  const result = await response.json();

  // 5. CRM Logging
  const logRef = adminDb.collection('users').doc(userId).collection('contacts').doc(contactId).collection('activityLogs');
  await logRef.add({
    type: 'email',
    date: new Date().toISOString(),
    subject,
    summary: body.substring(0, 200) + '...',
    outcome: 'sent',
    source: 'gmail_api',
    messageId: result.id,
    threadId: result.threadId,
    sentiment: 'neutral'
  });

  // 6. Quota Management
  const today = new Date().toISOString().split('T')[0];
  const quotaRef = adminDb.collection('users').doc(userId).collection('email_quota').doc(today);
  await quotaRef.set({
    count: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { messageId: result.id, threadId: result.threadId };
}

/**
 * Checks current daily quota.
 */
export async function checkGmailQuota(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const snap = await adminDb.collection('users').doc(userId).collection('email_quota').doc(today).get();
  return snap.data()?.count || 0;
}
