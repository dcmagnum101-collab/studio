
'use server';

import { searchRealtor, normalizeRealtorListing } from '@/services/realtor-service';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function syncRealtorListingsAction(userId: string, payload: { zipCode: string, status: 'active' | 'sold' }) {
  const { zipCode, status } = payload;
  
  try {
    const rawData = await searchRealtor(userId, { 
      city: 'Las Vegas', // Base city, API handles zip within it
      state_code: 'NV',
      limit: 40
    });

    if (!rawData?.properties) return { imported: 0, duplicates: 0 };

    let imported = 0;
    let duplicates = 0;
    const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');

    for (const raw of rawData.properties) {
      // Filter for requested zip locally if API doesn't support deep zip filtering in search
      if (raw.address?.postal_code !== zipCode) continue;

      const normalized = await normalizeRealtorListing(raw);
      
      const existing = await contactsRef.where('propertyAddress', '==', normalized.address).limit(1).get();
      
      if (existing.empty) {
        const isStale = (normalized.days_on_market || 0) > 60;
        
        await contactsRef.add({
          name: "Realtor Prospect",
          propertyAddress: normalized.address,
          city: normalized.city,
          listPrice: normalized.list_price,
          beds: normalized.beds,
          baths: normalized.baths,
          sqft: normalized.sqft,
          daysOnMarket: normalized.days_on_market,
          archagent_source: 'realtor',
          pipeline_stage: 'new_lead',
          icpScore: isStale ? 80 : 55,
          ai_urgency: isStale ? 'hot' : 'warm',
          archagent_tags: isStale ? ['stale-listing'] : [],
          ownerId: userId,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        imported++;
      } else {
        duplicates++;
      }
    }

    return { imported, duplicates, success: true };
  } catch (error: any) {
    console.error('[Realtor Action] Sync failed:', error);
    throw new Error(error.message);
  }
}
