import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { normalizePhone } from '@/lib/utils';

/**
 * @fileOverview Inbound Twilio Webhook Receiver.
 * Matches incoming phone numbers to CRM contacts and routes messages.
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From')?.toString() || '';
    const body = formData.get('Body')?.toString() || '';
    const to = formData.get('To')?.toString() || ''; // Monica's Twilio Number

    if (!from || !to) return new NextResponse('Missing required Twilio fields', { status: 400 });

    const normalizedFrom = normalizePhone(from);

    // 1. Identify the user (Monica) by the 'To' phone number
    // We search all user settings for this Twilio number
    const usersSnap = await adminDb.collectionGroup('settings')
      .where('phoneNumber', '==', to)
      .limit(1)
      .get();

    if (usersSnap.empty) {
      console.warn(`[Twilio Webhook] Received SMS for unassigned number: ${to}`);
      return new NextResponse('Receiver not found', { status: 200 }); // Return 200 so Twilio doesn't retry
    }

    const settingDoc = usersSnap.docs[0];
    const userId = settingDoc.ref.parent.parent?.id; // Parent of 'settings' subcoll is the user doc
    if (!userId) return new NextResponse('User ID mapping failed', { status: 500 });

    // 2. Find or Create Contact
    const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');
    const contactMatch = await contactsRef.where('phone', '==', normalizedFrom).limit(1).get();

    let contactId: string;
    let contactName: string;

    if (contactMatch.empty) {
      // Create a new lead from scratch
      const newContact = await contactsRef.add({
        name: `SMS Lead: ${normalizedFrom}`,
        phone: normalizedFrom,
        archagent_source: 'sms_inbound',
        pipeline_stage: 'new_lead',
        icpScore: 40,
        ai_urgency: 'warm',
        ownerId: userId,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      contactId = newContact.id;
      contactName = normalizedFrom;
    } else {
      contactId = contactMatch.docs[0].id;
      contactName = contactMatch.docs[0].data().name;
    }

    // 3. Persist to Message Thread
    const timestamp = new Date().toISOString();
    await contactsRef.doc(contactId).collection('sms_thread').add({
      direction: 'inbound',
      body,
      from,
      to,
      timestamp,
      status: 'received'
    });

    // 4. Update Contact Status
    await contactsRef.doc(contactId).update({
      unreadSMSCount: admin.firestore.FieldValue.increment(1),
      lastMessageSnippet: body.substring(0, 50),
      lastContactDate: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // 5. Respond with Twilio XML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'application/xml' }
    });

  } catch (error: any) {
    console.error('[Twilio Webhook] Critical Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}