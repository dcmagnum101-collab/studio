'use server';

/**
 * @fileOverview Strategic Appointment Briefing Service.
 * Uses Grok-4 to prepare agents for listing presentations.
 */

import { grokJSON } from '@/services/grok-service';
import { adminDb } from '@/lib/firebase-admin';

export interface AppointmentBrief {
  property_summary: string;
  seller_motivation: string;
  pricing_approach: string;
  likely_objections: string[];
  objection_responses: string[];
  conversation_starters: string[];
  things_to_avoid: string[];
  close_strategy: string;
  nevada_specific_notes: string;
}

/**
 * Generates a pre-appointment intelligence brief for a contact.
 */
export async function generateAppointmentBrief(userId: string, contactId: string): Promise<AppointmentBrief> {
  if (!userId || !contactId) throw new Error('Missing required parameters');

  const contactSnap = await adminDb.collection('users').doc(userId).collection('contacts').doc(contactId).get();
  if (!contactSnap.exists) throw new Error('Contact not found');
  const contact = contactSnap.data()!;

  // Fetch recent history for context
  const historySnap = await adminDb.collection('users')
    .doc(userId)
    .collection('contacts')
    .doc(contactId)
    .collection('activityLogs')
    .orderBy('date', 'desc')
    .limit(10)
    .get();
  
  const history = historySnap.docs.map(d => d.data());

  const system = `You are Monica Selvaggio's elite listing agent coach. 
  Generate a pre-appointment intelligence brief for a high-stakes listing presentation.
  Focus on tactical readiness, local market dominance, and emotional intelligence.
  
  Return ONLY valid JSON:
  {
    "property_summary": string,
    "seller_motivation": string,
    "pricing_approach": string,
    "likely_objections": string[],
    "objection_responses": string[],
    "conversation_starters": string[],
    "things_to_avoid": string[],
    "close_strategy": string,
    "nevada_specific_notes": string
  }`;

  const userPrompt = `
  AGENT: Monica Selvaggio
  MARKET: Las Vegas / Clark County
  
  CONTACT DATA:
  Name: ${contact.name}
  Address: ${contact.propertyAddress}
  Status: ${contact.pipeline_stage}
  Motivation: ${contact.motivation || 'Standard intent'}
  ICP Score: ${contact.icpScore}
  
  PROPERTY INTEL:
  Beds/Baths: ${contact.beds}/${contact.baths}
  SqFt: ${contact.sqft}
  DOM: ${contact.daysOnMarket || 'N/A'}
  Listing Price: ${contact.listPrice ? '$' + contact.listPrice.toLocaleString() : 'N/A'}
  
  CONVERSATION HISTORY:
  ${JSON.stringify(history)}
  `;

  try {
    return await grokJSON<AppointmentBrief>(system, userPrompt, userId);
  } catch (error) {
    console.error('[Brief Action] Generation failed:', error);
    throw new Error('Monica could not synthesize the brief. Please check Grok API configuration.');
  }
}
