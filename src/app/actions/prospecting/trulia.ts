
'use server';

import { searchTrulia, normalizeTruliaListing } from '@/services/trulia-service';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { MONICA_MARKET_HASHES } from '@/config/trulia-constants';

export async function syncTruliaListingsAction(userId: string, payload: { zipCode: string, type: 'for_sale' | 'recently_sold' | 'for_rent' }) {
  const { zipCode, type } = payload;
  
  // Note: In a production app, we'd generate a hash for the specific zip. 
  // For MVP, we use the city-level hashes and filter.
  const hash = MONICA_MARKET_HASHES.las_vegas;
  
  let listingType: 'FOR_SALE' | 'SOLD' = type === 'recently_sold' ? 'SOLD' : 'FOR_SALE';
  
  try {
    const rawData = await searchTrulia(userId, { 
      encodedHash: hash, 
      listingType,
      filters: { zipCode }
    });

    if (!rawData?.data) return { imported: 0, duplicates: 0 };

    let imported = 0;
    let duplicates = 0;
    const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');

    for (const raw of rawData.data) {
      const normalized = await normalizeTruliaListing(raw);
      
      // Dedupe by address
      const existing = await contactsRef.where('propertyAddress', '==', normalized.address).limit(1).get();
      
      if (existing.empty) {
        await contactsRef.add({
          name: "Trulia Prospect",
          propertyAddress: normalized.address,
          city: normalized.city,
          listPrice: normalized.list_price,
          beds: normalized.beds,
          baths: normalized.baths,
          sqft: normalized.sqft,
          daysOnMarket: normalized.days_on_market,
          archagent_source: 'trulia',
          pipeline_stage: 'new_lead',
          icpScore: 60,
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
    console.error('[Trulia Action] Sync failed:', error);
    throw new Error(error.message);
  }
}
