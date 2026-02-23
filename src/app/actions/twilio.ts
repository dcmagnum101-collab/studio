'use server';

/**
 * @fileOverview Strategic Twilio Outbound Messaging Action.
 * Handles authenticated transmission and CRM logging.
 */

import twilio from 'twilio';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function sendSMSAction(payload: {
  userId: string;
  contactId: string;
  to: string;
  body: string;
}) {
  const { userId, contactId, to, body } = payload;

  try {
    // 1. Load Twilio Settings
    const settingsSnap = await adminDb.collection('users').doc(userId).collection('settings').doc('twilio').get();
    if (!settingsSnap.exists) throw new Error('Twilio not configured in Settings.');
    
    const { sid, token, phoneNumber } = settingsSnap.data()!;
    if (!sid || !token || !phoneNumber) throw new Error('Missing Twilio credentials.');

    const client = twilio(sid, token);

    // 2. Send Message
    const message = await client.messages.create({
      body,
      from: phoneNumber,
      to
    });

    // 3. Log to CRM
    const threadRef = adminDb.collection('users').doc(userId).collection('contacts').doc(contactId).collection('sms_thread');
    await threadRef.add({
      direction: 'outbound',
      body,
      from: phoneNumber,
      to,
      sid: message.sid,
      timestamp: new Date().toISOString(),
      status: 'sent',
      ownerId: userId // Ensure ownership for collection group queries
    });

    await adminDb.collection('users').doc(userId).collection('contacts').doc(contactId).update({
      lastContactDate: admin.firestore.FieldValue.serverTimestamp(),
      lastMessageSnippet: body.substring(0, 50),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error('[Twilio Action] Send failed:', error);
    throw new Error(error.message || 'Failed to transmit SMS.');
  }
}
