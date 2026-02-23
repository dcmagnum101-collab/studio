'use server';

/**
 * @fileOverview Prospecting Enrichment Service.
 * Handles URL intelligence extraction, deduplication, and lead creation.
 */

import { grokJSON } from './grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { normalizePhone } from '@/lib/utils';

interface EnrichmentResult {
  firstName?: string;
  lastName?: string;
  name: string;
  email?: string;
  phone?: string;
  propertyAddress?: string;
  motivation?: string;
  location?: string;
  bio?: string;
}

/**
 * Creates a prospecting job and initiates extraction via Grok.
 */
export async function runProspectingJob(userId: string, url: string): Promise<string> {
  const userRef = adminDb.collection('users').doc(userId);
  const jobRef = await userRef.collection('prospecting_jobs').add({
    url,
    status: 'pending',
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });

  // Start processing (async background task)
  processEnrichmentJob(userId, jobRef.id, url);

  return jobRef.id;
}

async function processEnrichmentJob(userId: string, jobId: string, url: string) {
  const userRef = adminDb.collection('users').doc(userId);
  const jobRef = userRef.collection('prospecting_jobs').doc(jobId);

  try {
    await jobRef.update({ status: 'processing' });

    const system = `${monicaSystemPrompt}
    You are a web intelligence extractor for real estate leads.
    Your goal is to extract structured contact and property info from a URL or text content.
    Return ONLY JSON.`;

    const userPrompt = `Extract lead data from this URL: ${url}. 
    Focus on name, email, phone, and property address if visible. 
    If this is a social profile, extract location and bio indicators of moving.`;

    const extracted = await grokJSON<EnrichmentResult>(system, userPrompt, userId);
    const normalizedPhone = extracted.phone ? normalizePhone(extracted.phone) : '';

    let existingContactId: string | null = null;

    if (extracted.email) {
      const emailMatch = await userRef.collection('contacts').where('email', '==', extracted.email).limit(1).get();
      if (!emailMatch.empty) {
        existingContactId = emailMatch.docs[0].id;
      }
    }

    if (!existingContactId && normalizedPhone) {
      const phoneMatch = await userRef.collection('contacts').where('phone', '==', normalizedPhone).limit(1).get();
      if (!phoneMatch.empty) {
        existingContactId = phoneMatch.docs[0].id;
      }
    }

    if (existingContactId) {
      await userRef.collection('contacts').doc(existingContactId).update({
        source_evidence: admin.firestore.FieldValue.arrayUnion(url),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      const newContact = await userRef.collection('contacts').add({
        name: extracted.name || 'Unknown Contact',
        firstName: extracted.firstName || '',
        lastName: extracted.lastName || '',
        email: extracted.email || '',
        phone: normalizedPhone,
        propertyAddress: extracted.propertyAddress || '',
        motivation: extracted.motivation || 'Extracted from URL enrichment',
        icpScore: 50,
        archagent_source: 'url_enrichment',
        source_evidence: [url],
        pipeline_stage: 'new_lead',
        ownerId: userId,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      existingContactId = newContact.id;
    }

    await userRef.collection('lead_sources').add({
      url,
      extracted_data: extracted,
      contact_id: existingContactId,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    await jobRef.update({ 
      status: 'completed', 
      result_contact_id: existingContactId 
    });

  } catch (error: any) {
    console.error(`[Prospecting Worker] failure for job ${jobId}:`, error);
    await jobRef.update({ status: 'failed', error: error.message });
  }
}
