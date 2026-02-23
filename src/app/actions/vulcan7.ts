
'use server';

import Papa from 'papaparse';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { calculateAIScore, type LeadStatus, type Lead } from '@/lib/lead-types';
import { normalizePhone } from '@/lib/utils';

/**
 * Robust Vulcan7 CSV Import Server Action.
 * Handles parsing, DNC scrubbing, deduplication, and initial ICP scoring.
 */
export async function syncVulcan7Leads(userId: string, csvData: string) {
  const results = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  const rows = results.data as any[];

  let imported = 0;
  let skipped = 0;
  let duplicates = 0;

  const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');
  let batch = adminDb.batch();
  let batchCount = 0;

  for (const row of rows) {
    // 1. Scrub DNC records
    const dnc = (row['DNC'] || '').toString().toUpperCase();
    if (dnc === 'Y' || dnc === 'TRUE' || dnc === 'YES') {
      skipped++;
      continue;
    }

    // 2. Validate Phone 1
    const rawPhone = row['Phone 1'];
    if (!rawPhone) {
      skipped++;
      continue;
    }

    const phone = normalizePhone(rawPhone);
    
    // 3. Deduplicate against existing contacts in Firestore
    const existing = await contactsRef.where('phone', '==', phone).limit(1).get();
    if (!existing.empty) {
      duplicates++;
      continue;
    }

    // 4. Map Vulcan7 List Type to Monica LeadStatus
    const rawType = (row['List Type'] || '').toString();
    let status: LeadStatus = 'new';
    if (rawType.toLowerCase().includes('expired')) status = 'expired';
    else if (rawType.toLowerCase().includes('fsbo')) status = 'fsbo';
    else if (rawType.toLowerCase().includes('pre-foreclosure')) status = 'pre-foreclosure';

    const firstName = row['First Name'] || '';
    const lastName = row['Last Name'] || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Lead';

    // 5. Prepare data for ICP Score Calculation
    const leadDataForScore: Partial<Lead> = {
      firstName,
      lastName,
      fullName,
      address: row['Property Address'] || '',
      city: row['City'] || '',
      state: row['State'] || '',
      zip: row['Zip'] || '',
      phone,
      phone2: row['Phone 2'] ? normalizePhone(row['Phone 2']) : '',
      email: row['Email'] || '',
      status,
      listPrice: parseFloat(row['Asking Price']?.toString().replace(/[$,]/g, '')) || 0,
      bedrooms: parseInt(row['Bedrooms']) || 0,
      bathrooms: parseFloat(row['Bathrooms']) || 0,
      sqft: parseInt(row['Sq Ft']) || 0,
      listingExpiredDate: status === 'expired' ? (row['List Date'] || null) : null,
    };

    const icpScore = calculateAIScore(leadDataForScore);
    const nextFollowUpDate = new Date().toISOString(); // Default to immediate action

    // 6. Stage document for batch write
    const newDocRef = contactsRef.doc();
    batch.set(newDocRef, {
      firstName,
      lastName,
      name: fullName,
      propertyAddress: leadDataForScore.address,
      city: leadDataForScore.city,
      state: leadDataForScore.state,
      zip: leadDataForScore.zip,
      phone,
      phone2: leadDataForScore.phone2,
      email: leadDataForScore.email,
      icpScore,
      pipeline_stage: 'new_lead',
      archagent_source: 'vulcan7',
      archagent_tags: [status, 'vulcan7_import'],
      motivation: `Vulcan7 Import: ${rawType}`,
      followUpStage: 0,
      nextFollowUpDate,
      ownerId: userId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      // Lead specs for UI components
      beds: leadDataForScore.bedrooms,
      baths: leadDataForScore.bathrooms,
      sqft: leadDataForScore.sqft,
      listPrice: leadDataForScore.listPrice,
    });

    batchCount++;
    imported++;

    // 7. Flush batch every 500 documents (Firestore limit)
    if (batchCount >= 500) {
      await batch.commit();
      batch = adminDb.batch();
      batchCount = 0;
    }
  }

  // 8. Commit final partial batch
  if (batchCount > 0) {
    await batch.commit();
  }

  return { imported, skipped, duplicates };
}
