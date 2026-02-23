'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Sends a nurture email via Gmail API and logs it to CRM.
 * This server action handles the direct communication with Google's API.
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

  // 1. Load Tokens from Integrations
  const tokenDoc = await adminDb.collection('users').doc(userId).collection('integrations').doc('gmail').get();
  if (!tokenDoc.exists) throw new Error('Gmail not connected. Please connect your account in Settings.');
  
  const { accessToken } = tokenDoc.data()!;

  // 2. Construct RFC 2822 Message
  // Subject needs base64 encoding for non-ASCII safety
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

  // 3. Send via Gmail API
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
    // Handle expired tokens (status 401)
    if (response.status === 401) {
      throw new Error('Gmail session expired. Please re-connect your Google account.');
    }
    throw new Error(`Gmail API error: ${error.error?.message || 'Unknown failure'}`);
  }

  const result = await response.json();

  // 4. CRM Logging (Activity History)
  const logRef = adminDb.collection('users').doc(userId).collection('contacts').doc(contactId).collection('activityLogs');
  await logRef.add({
    type: 'email',
    date: new Date().toISOString(),
    subject,
    summary: body.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...',
    outcome: 'delivered',
    source: 'gmail_api',
    messageId: result.id,
    threadId: result.threadId,
    sentiment: 'neutral',
    ownerId: userId
  });

  // 5. Quota Management
  const today = new Date().toISOString().split('T')[0];
  const quotaRef = adminDb.collection('users').doc(userId).collection('email_quota').doc(today);
  await quotaRef.set({
    count: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true, messageId: result.id };
}

/**
 * Checks if Gmail integration is established for a user.
 */
export async function getGmailConnectionStatus(userId: string) {
  const tokenDoc = await adminDb.collection('users').doc(userId).collection('integrations').doc('gmail').get();
  return tokenDoc.exists;
}