
'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Mock sync for Clark County NOD/Probate records.
 * In a real scenario, this would scrape maps.clarkcountynv.gov or use a title API.
 */
export async function syncPublicRecordsAction(userId: string, payload: { zipCode: string, type: 'preforeclosure' | 'probate' }) {
  const { zipCode, type } = payload;
  
  try {
    // Simulate finding records
    const mockRecords = [
      { address: `123 Demo St, Las Vegas, ${zipCode}`, owner: 'John Doe', type: 'NOD' },
      { address: `456 Example Ave, Las Vegas, ${zipCode}`, owner: 'Jane Smith', type: 'Probate' },
    ].filter(r => (type === 'preforeclosure' && r.type === 'NOD') || (type === 'probate' && r.type === 'Probate'));

    let imported = 0;
    const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');

    for (const record of mockRecords) {
      const existing = await contactsRef.where('propertyAddress', '==', record.address).limit(1).get();
      
      if (existing.empty) {
        await contactsRef.add({
          name: record.owner,
          propertyAddress: record.address,
          motivation: type === 'preforeclosure' ? 'Notice of Default Filing' : 'Recent Probate Filing',
          archagent_source: type === 'preforeclosure' ? 'preforeclosure' : 'probate',
          pipeline_stage: 'new_lead',
          icpScore: type === 'preforeclosure' ? 95 : 85,
          ai_urgency: 'hot',
          ownerId: userId,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        imported++;
      }
    }

    return { imported, success: true };
  } catch (error: any) {
    console.error('[Public Records Action] Sync failed:', error);
    throw new Error(error.message);
  }
}
