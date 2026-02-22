'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Saves a specific settings section to Firestore.
 */
export async function saveSettingsSection(payload: { 
  uid: string; 
  section: string; 
  data: any;
}) {
  const { uid, section, data } = payload;

  try {
    const docRef = adminDb
      .collection('users')
      .doc(uid)
      .collection('settings')
      .doc(section);

    await docRef.set({
      ...data,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error(`[Settings Action] Failed to save ${section}:`, error);
    throw new Error(error.message);
  }
}
