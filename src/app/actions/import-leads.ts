'use server';

/**
 * CSV import server actions for all three dialers:
 * Vulcan7, ArchAgent, and RedX.
 * Each normalizes columns, scrubs DNC, dedupes by phone, scores, and writes
 * to users/{userId}/contacts in batches of ≤499.
 */

import Papa from 'papaparse';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { calculateAIScore, type LeadStatus } from '@/lib/lead-types';
import { normalizePhone } from '@/lib/utils';

type ImportResult = { imported: number; skipped: number; duplicates: number };

// ─── Shared batch writer ─────────────────────────────────────────────────────

async function writeBatches(
  userId: string,
  records: any[]
): Promise<ImportResult> {
  const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');
  let batch = adminDb.batch();
  let batchCount = 0;
  let imported = 0;
  let skipped = 0;
  let duplicates = 0;

  for (const record of records) {
    if (!record.phone) { skipped++; continue; }

    const existing = await contactsRef.where('phone', '==', record.phone).limit(1).get();
    if (!existing.empty) { duplicates++; continue; }

    const newDocRef = contactsRef.doc();
    batch.set(newDocRef, {
      ...record,
      ownerId: userId,
      pipeline_stage: 'new_lead',
      followUpStage: 0,
      nextFollowUpDate: new Date().toISOString(),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    batchCount++;
    imported++;

    if (batchCount >= 499) {
      await batch.commit();
      batch = adminDb.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();
  return { imported, skipped, duplicates };
}

// ─── phone normalizer + DNC check helpers ───────────────────────────────────

function isDNC(raw: string | undefined): boolean {
  if (!raw) return false;
  const v = raw.toString().toUpperCase().trim();
  return v === 'Y' || v === 'YES' || v === 'TRUE' || v === '1';
}

function mapLeadType(raw: string): LeadStatus {
  const s = (raw || '').toLowerCase();
  if (s.includes('expired')) return 'expired';
  if (s.includes('fsbo') || s.includes('for sale by owner')) return 'fsbo';
  if (s.includes('pre-foreclosure') || s.includes('preforeclosure') || s.includes('pre foreclosure')) return 'pre-foreclosure';
  if (s.includes('geo') || s.includes('circle')) return 'circle';
  return 'new';
}

// ─── Vulcan7 ─────────────────────────────────────────────────────────────────

export async function importVulcan7CSV(userId: string, csvData: string): Promise<ImportResult> {
  const { data: rows } = Papa.parse<any>(csvData, { header: true, skipEmptyLines: true });
  const records: any[] = [];
  let skipped = 0;

  for (const row of rows) {
    if (isDNC(row['DNC'])) { skipped++; continue; }
    const rawPhone = row['Phone 1'] || row['Phone1'] || row['phone 1'] || row['phone'];
    if (!rawPhone) { skipped++; continue; }

    const phone = normalizePhone(rawPhone);
    const status = mapLeadType(row['List Type'] || '');
    const firstName = row['First Name'] || row['FirstName'] || '';
    const lastName = row['Last Name'] || row['LastName'] || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Lead';

    const partial = {
      status,
      phone,
      email: row['Email'] || '',
      listPrice: parseFloat((row['Asking Price'] || '0').toString().replace(/[$,]/g, '')) || 0,
      bedrooms: parseInt(row['Bedrooms'] || '0') || 0,
    };

    records.push({
      firstName,
      lastName,
      name: fullName,
      phone,
      phone2: row['Phone 2'] ? normalizePhone(row['Phone 2']) : '',
      email: row['Email'] || '',
      propertyAddress: row['Property Address'] || '',
      city: row['City'] || '',
      state: row['State'] || 'NV',
      zip: row['Zip'] || '',
      archagent_source: 'vulcan7',
      archagent_tags: [status, 'vulcan7_import'],
      icpScore: calculateAIScore(partial as any),
      listPrice: partial.listPrice,
      beds: partial.bedrooms,
      baths: parseFloat(row['Bathrooms'] || '0') || 0,
      sqft: parseInt(row['Sq Ft'] || '0') || 0,
      motivation: `Vulcan7: ${row['List Type'] || 'Unknown'}`,
    });
  }

  const result = await writeBatches(userId, records);
  return { imported: result.imported, skipped: result.skipped + skipped, duplicates: result.duplicates };
}

// ─── ArchAgent ───────────────────────────────────────────────────────────────

export async function importArchAgentCSV(userId: string, csvData: string): Promise<ImportResult> {
  const { data: rows } = Papa.parse<any>(csvData, { header: true, skipEmptyLines: true });
  const records: any[] = [];
  let skipped = 0;

  for (const row of rows) {
    const rawPhone = row['Phone'] || row['phone'] || row['Phone Number'] || row['Primary Phone'];
    if (!rawPhone) { skipped++; continue; }

    const phone = normalizePhone(rawPhone);
    const status = mapLeadType(row['Lead Type'] || row['Type'] || '');

    // Split "Full Name" → firstName + lastName
    const fullName = row['Name'] || row['Full Name'] || '';
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const partial = { status, phone, email: row['Email'] || '' };

    records.push({
      firstName,
      lastName,
      name: fullName || `${firstName} ${lastName}`.trim() || 'Unknown Lead',
      phone,
      email: row['Email'] || '',
      propertyAddress: row['Address'] || row['Property Address'] || '',
      city: row['City'] || '',
      state: row['State'] || 'NV',
      zip: row['Zip'] || row['Zip Code'] || '',
      archagent_source: 'archagent',
      archagent_tags: [status, 'archagent_import'],
      icpScore: calculateAIScore(partial as any),
      motivation: `ArchAgent: ${row['Lead Type'] || 'Unknown'}`,
    });
  }

  const result = await writeBatches(userId, records);
  return { imported: result.imported, skipped: result.skipped + skipped, duplicates: result.duplicates };
}

// ─── RedX ─────────────────────────────────────────────────────────────────────

export async function importRedXCSV(userId: string, csvData: string): Promise<ImportResult> {
  const { data: rows } = Papa.parse<any>(csvData, { header: true, skipEmptyLines: true });
  const records: any[] = [];
  let skipped = 0;

  for (const row of rows) {
    // RedX may have multiple phones; take first non-empty
    const rawPhone =
      row['Phone Number'] ||
      row['Phone 1'] ||
      row['Primary Phone'] ||
      row['phone'] ||
      row['Phone'];
    if (!rawPhone) { skipped++; continue; }

    const phone = normalizePhone(rawPhone.toString().split('/')[0].trim());

    // Map RedX lead types
    const rawType = row['Lead Type'] || row['Type'] || '';
    let status: LeadStatus = 'new';
    if (rawType.toLowerCase().includes('expired')) status = 'expired';
    else if (rawType.toLowerCase().includes('fsbo')) status = 'fsbo';
    else if (rawType.toLowerCase().includes('geo')) status = 'circle';
    else if (rawType.toLowerCase().includes('pre-foreclosure') || rawType.toLowerCase().includes('preforeclosure')) status = 'pre-foreclosure';

    const firstName = row['First Name'] || row['FirstName'] || '';
    const lastName = row['Last Name'] || row['LastName'] || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Lead';

    const partial = { status, phone, email: row['Email Address'] || row['Email'] || '' };

    records.push({
      firstName,
      lastName,
      name: fullName,
      phone,
      email: row['Email Address'] || row['Email'] || '',
      propertyAddress: row['Property Address'] || row['Address'] || '',
      city: row['City'] || '',
      state: row['State'] || 'NV',
      zip: row['Zip Code'] || row['Zip'] || '',
      archagent_source: 'redx',
      archagent_tags: [status, 'redx_import'],
      icpScore: calculateAIScore(partial as any),
      motivation: `RedX: ${rawType || 'Unknown'}`,
    });
  }

  const result = await writeBatches(userId, records);
  return { imported: result.imported, skipped: result.skipped + skipped, duplicates: result.duplicates };
}
