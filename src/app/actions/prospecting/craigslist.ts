
'use server';

import { grokJSON } from '@/services/grok-service';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Scrapes FSBO listings from Craigslist and analyzes them via Grok.
 */
export async function syncCraigslistFSBOAction(userId: string, payload: { city: string }) {
  const { city } = payload;
  const baseUrl = `https://${city}.craigslist.org/search/fsbo?format=json`;

  try {
    const res = await fetch(baseUrl);
    if (!res.ok) throw new Error('Craigslist fetch failed');
    const data = await res.json();

    // Craigslist JSON structure varies, usually [0] is meta, [1] is items
    const items = data[1] || [];
    let imported = 0;
    let analyzed = 0;

    const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');

    for (const item of items.slice(0, 15)) { // Process top 15 for performance
      analyzed++;
      
      const system = "You are a real estate lead analyzer. Extract the property address and motivation from this Craigslist title and snippet. Return JSON.";
      const userPrompt = `Title: ${item.Title}\nSnippet: ${item.Body || 'N/A'}`;
      
      const extraction = await grokJSON<{ address: string, bedrooms: number, motivation: string }>(system, userPrompt, userId);

      if (!extraction.address) continue;

      const existing = await contactsRef.where('propertyAddress', '==', extraction.address).limit(1).get();
      
      if (existing.empty) {
        await contactsRef.add({
          name: "Craigslist FSBO",
          propertyAddress: extraction.address,
          motivation: extraction.motivation,
          archagent_source: 'fsbo',
          pipeline_stage: 'new_lead',
          icpScore: 75,
          ownerId: userId,
          source_evidence: [item.URL],
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        imported++;
      }
    }

    return { imported, analyzed, success: true };
  } catch (error: any) {
    console.error('[Craigslist Action] Sync failed:', error);
    throw new Error(error.message);
  }
}
