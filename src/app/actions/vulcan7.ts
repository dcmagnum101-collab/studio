'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { getNextFollowUpDate, type LeadStatus } from '@/lib/lead-types';
import { normalizePhone } from '@/lib/utils';

/**
 * Syncs leads from a Vulcan7 CSV export string.
 */
export async function syncVulcan7Leads(userId: string, csvData: string) {
  const lines = csvData.split('\n');
  if (lines.length < 2) return { imported: 0, skipped_dnc: 0, duplicates: 0 };

  const headers = lines[0].split(',').map((h) => h.trim());
  let imported = 0;
  let skipped_dnc = 0;
  let duplicates = 0;

  const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((v) => v.trim());
    if (row.length < headers.length) continue;

    const data: any = {};
    headers.forEach((h, idx) => (data[h] = row[idx]));

    // 1. Skip DNC
    if (data.DNC === 'true' || data.DNC === 'Y' || data.DNC === 'Yes') {
      skipped_dnc++;
      continue;
    }

    const rawPhone = data.Phone;
    if (!rawPhone) continue;

    const normalizedPhone = normalizePhone(rawPhone);

    // 2. Deduplicate by Phone
    const existing = await contactsRef.where('phone', '==', normalizedPhone).limit(1).get();
    if (!existing.empty) {
      duplicates++;
      continue;
    }

    // 3. Map Type and Calculate Score
    const typeMap: Record<string, LeadStatus> = {
      Expired: 'expired',
      FSBO: 'fsbo',
      PreForeclosure: 'pre-foreclosure',
      FRBO: 'frbo',
    };

    const scoreMap: Record<string, number> = {
      expired: 85,
      fsbo: 78,
      'pre-foreclosure': 90,
      frbo: 65,
    };

    const status = typeMap[data.Type] || 'new';
    const aiScore = scoreMap[status] || 50;

    // 4. Write to Firestore
    await contactsRef.add({
      name: `${data.FirstName} ${data.LastName}`,
      firstName: data.FirstName,
      lastName: data.LastName,
      phone: normalizedPhone,
      phone2: data.Phone2 ? normalizePhone(data.Phone2) : '',
      propertyAddress: data.Address,
      city: data.City,
      state: data.State,
      zip: data.Zip,
      archagent_source: 'vulcan7',
      archagent_tags: [data.Type.toLowerCase(), 'vulcan7_import'],
      pipeline_stage: 'new_lead',
      icpScore: aiScore,
      status: status,
      ownerId: userId,
      followUpStage: 0,
      motivation: `Vulcan7 Import: ${data.Type}`,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    imported++;
  }

  return { imported, skipped_dnc, duplicates };
}

/**
 * Generates a CSV export string for Vulcan7 Dialer from a list of contact IDs.
 */
export async function pushToVulcan7DialQueue(userId: string, contactIds: string[]) {
  const header = 'FirstName,LastName,Phone,Address,City,State,Zip';
  const rows: string[] = [];

  for (const id of contactIds) {
    const doc = await adminDb.collection('users').doc(userId).collection('contacts').doc(id).get();
    if (doc.exists) {
      const d = doc.data()!;
      rows.push(
        `"${d.firstName || ''}","${d.lastName || ''}","${d.phone || ''}","${d.propertyAddress || ''}","${d.city || ''}","${d.state || ''}","${d.zip || ''}"`
      );
    }
  }

  return [header, ...rows].join('\n');
}

/**
 * Fetches contact IDs eligible for dialing (Score >= 70, not called in 3 days).
 */
export async function getContactsForVulcan7Export(userId: string) {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('contacts')
    .where('icpScore', '>=', 70)
    .get();

  const filtered = snapshot.docs.filter((doc) => {
    const d = doc.data();
    if (!d.lastContactDate) return true;
    const lastDate = d.lastContactDate.toDate
      ? d.lastContactDate.toDate()
      : new Date(d.lastContactDate);
    return lastDate < threeDaysAgo;
  });

  return filtered.map((d) => d.id);
}

/**
 * Logs a call result from Vulcan7, updates cadence, and creates follow-up tasks.
 */
export async function logVulcan7CallResult(
  userId: string,
  contactId: string,
  payload: {
    outcome: string;
    notes: string;
    duration: number;
    nextAction: string;
  }
) {
  const contactRef = adminDb.collection('users').doc(userId).collection('contacts').doc(contactId);
  const contactDoc = await contactRef.get();
  if (!contactDoc.exists) throw new Error('Contact not found');
  const contact = contactDoc.data()!;

  // 1. Log Activity
  await contactRef.collection('activityLogs').add({
    type: 'call',
    source: 'vulcan7',
    date: new Date().toISOString(),
    outcome: payload.outcome,
    summary: payload.notes,
    duration: payload.duration,
    sentiment: payload.outcome === 'Appointment Set' ? 'positive' : 'neutral',
  });

  // 2. Advance Cadence
  const currentStage = contact.followUpStage || 0;
  const nextStage = currentStage + 1;
  const nextDate = getNextFollowUpDate(contact.status as LeadStatus, nextStage);

  await contactRef.update({
    lastContactDate: admin.firestore.FieldValue.serverTimestamp(),
    followUpStage: nextStage,
    nextFollowUpDate: nextDate.toISOString(),
    ai_next_best_action: payload.nextAction,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 3. Create Follow-up Task
  await adminDb.collection('users').doc(userId).collection('tasks').add({
    contactId,
    contact_name: contact.name,
    title: `Vulcan7 Follow-up: ${payload.nextAction}`,
    description: `Auto-generated from outcome: ${payload.outcome}. Notes: ${payload.notes}`,
    priority: payload.outcome === 'Appointment Set' ? 'urgent' : 'normal',
    status: 'pending',
    due_date: nextDate.toISOString(),
    type: 'call',
    ownerId: userId,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
}
