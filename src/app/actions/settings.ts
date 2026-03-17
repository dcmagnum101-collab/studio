'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Saves a specific settings section to Firestore using Admin SDK.
 */
export async function saveSettingsSection(
  uid: string, 
  section: string, 
  data: Record<string, any>
) {
  try {
    await adminDb
      .collection('users')
      .doc(uid)
      .collection('settings')
      .doc(section)
      .set({
        ...data,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    console.error(`[Settings Action] Save failed for ${section}:`, error);
    throw new Error(error.message || 'Failed to save settings');
  }
}

/**
 * Loads all relevant settings documents for a user in one pass.
 */
export async function loadAllSettings(uid: string) {
  const sections = [
    'business',
    'ai_grok',
    'ai_behavior',
    'dialer_v7',
    'lvr_mls',
    'rapidapi',
    'google_apis',
    'social',
    'outreach_gmail',
    'twilio',
  ];
  
  const results: Record<string, any> = {};
  
  try {
    const promises = sections.map(section => 
      adminDb.collection('users').doc(uid).collection('settings').doc(section).get()
    );
    
    const snapshots = await Promise.all(promises);
    
    snapshots.forEach((doc, index) => {
      if (doc.exists) {
        results[sections[index]] = doc.data();
      }
    });
    
    return results;
  } catch (error: any) {
    console.error('[Settings Action] Load all failed:', error);
    return {};
  }
}
