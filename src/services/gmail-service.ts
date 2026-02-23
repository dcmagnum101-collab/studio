'use server';

import { google } from 'googleapis';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { createHash } from 'crypto';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
);

export async function getGmailClient(userId: string) {
  const tokenDoc = await adminDb.collection('users').doc(userId).collection('integrations').doc('gmail').get();
  
  if (!tokenDoc.exists) {
    throw new Error('Gmail not connected');
  }

  const tokens = tokenDoc.data()?.tokens;
  oauth2Client.setCredentials(tokens);

  oauth2Client.on('tokens', (newTokens) => {
    if (newTokens.refresh_token) {
      adminDb.collection('users').doc(userId).collection('integrations').doc('gmail').set({
        tokens: newTokens,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function checkUnsubscribe(userId: string, email: string): Promise<boolean> {
  const hashedEmail = createHash('sha256').update(email.toLowerCase()).digest('hex');
  const unsubDoc = await adminDb.collection('users').doc(userId).collection('unsubscribes').doc(hashedEmail).get();
  return unsubDoc.exists;
}

export async function logMessage(userId: string, messageData: {
  leadId?: string;
  threadId: string;
  subject: string;
  body: string;
  to: string;
  status: 'sent' | 'received' | 'failed';
}) {
  await adminDb.collection('users').doc(userId).collection('messages').add({
    ...messageData,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });
}
