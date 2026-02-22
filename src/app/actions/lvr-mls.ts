
'use server';

/**
 * @fileOverview LVR MLS Server Actions for UI components.
 */

import { queryLVRListings, normalizeLVRProperty, getMarketVitals } from '@/services/lvr-mls-service';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function syncLVRListings(payload: {
  type: 'active' | 'expired' | 'pending' | 'sold';
  zipCodes: string[];
  userId: string;
}) {
  const { type, zipCodes, userId } = payload;
  
  let statusCodes: string[] = [];
  let source = 'mls-sync';
  let extraFilter = '';

  switch (type) {
    case 'active':
      statusCodes = ['Active'];
      source = 'mls-active';
      break;
    case 'expired':
      statusCodes = ['Expired', 'Withdrawn'];
      source = 'expired-mls';
      // Expired in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      extraFilter = `ExpirationDate ge ${thirtyDaysAgo.toISOString().split('T')[0]}`;
      break;
    case 'pending':
      statusCodes = ['Pending', 'Under Contract'];
      source = 'mls-pending';
      break;
    case 'sold':
      statusCodes = ['Closed'];
      source = 'mls-sold';
      break;
  }

  try {
    const rawListings = await queryLVRListings({ status: statusCodes, zipCodes, filter: extraFilter });
    
    let imported = 0;
    let duplicates = 0;

    const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');

    for (const raw of rawListings) {
      const normalized = await normalizeLVRProperty(raw, source);
      
      // Deduplicate by MLS Number
      const existing = await contactsRef.where('mlsNumber', '==', normalized.mlsNumber).limit(1).get();
      
      if (existing.empty) {
        await contactsRef.add({
          ...normalized,
          ownerId: userId,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        imported++;
      } else {
        duplicates++;
      }
    }

    return { success: true, imported, duplicates, total: rawListings.length };
  } catch (error: any) {
    console.error('[LVR Action] Sync failed:', error);
    throw new Error(error.message);
  }
}

export async function getExpiringLeadsAction(userId: string, zipCodes: string[]) {
  // Query for listings expiring in the next 7 days
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const filter = `ExpirationDate le ${nextWeek.toISOString().split('T')[0]} and ExpirationDate ge ${new Date().toISOString().split('T')[0]}`;

  const raw = await queryLVRListings({ status: ['Active'], zipCodes, filter });
  return Promise.all(raw.map(async (r: any) => await normalizeLVRProperty(r, 'pre-expiry-alert')));
}

export async function fetchNeighborhoodStats(userId: string, zipCodes: string[]) {
  const stats = await Promise.all(zipCodes.map(zip => getMarketVitals(userId, zip)));
  return stats;
}

export async function refreshListingDetailAction(userId: string, mlsNumber: string) {
  // Queries a single listing by ID
  const raw = await queryLVRListings({ status: ['Active', 'Expired', 'Closed', 'Pending'], zipCodes: [], filter: `ListingId eq '${mlsNumber}'` });
  if (!raw.length) throw new Error('Listing not found in LVR feed.');
  return await normalizeLVRProperty(raw[0], 'mls-refresh');
}
