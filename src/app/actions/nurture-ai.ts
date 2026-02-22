
'use server';

import { grokJSON } from '@/services/grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Generates a strategic nurture email using Grok-4.
 */
export async function generateNurtureEmail(userId: string, contactId: string) {
  const contactSnap = await adminDb.collection('users').doc(userId).collection('contacts').doc(contactId).get();
  if (!contactSnap.exists) throw new Error('Contact not found');
  const contact = contactSnap.data()!;

  const system = `${monicaSystemPrompt}
  You are an expert real estate nurture engine.
  STRICT RULES:
  1. No discriminatory language.
  2. Must identify as Monica Selvaggio (licensed agent) or her assistant.
  3. Include an "Unsubscribe" reference placeholder.
  4. Review context to avoid repetition.
  Return JSON: { subject, body, compliance_notes, suggested_followup_days }`;

  const userPrompt = `Generate a follow-up email for ${contact.name}. 
  Address: ${contact.propertyAddress}
  Status: ${contact.pipeline_stage}
  Motivation: ${contact.motivation || 'Standard'}
  Current Cadence Step: ${contact.followUpStage || 0}`;

  return grokJSON<{
    subject: string;
    body: string;
    compliance_notes: string;
    suggested_followup_days: number;
  }>(system, userPrompt, userId);
}

/**
 * Generates coaching for a live call.
 */
export async function generateConversationCoaching(userId: string, contactId: string) {
  const contactSnap = await adminDb.collection('users').doc(userId).collection('contacts').doc(contactId).get();
  if (!contactSnap.exists) throw new Error('Contact not found');
  const contact = contactSnap.data()!;

  const system = `${monicaSystemPrompt}
  Provide tactical coaching for a phone call. 
  Focus on high-leverage questions and NAR-compliant objection handling.
  Return JSON matching the requested structure.`;

  const userPrompt = `Coach me for a call with ${contact.name} (${contact.propertyAddress}). 
  Motivation: ${contact.motivation}`;

  return grokJSON<{
    talking_points: string[];
    objections: string[];
    responses: string[];
    avoid: string[];
    goal: string;
  }>(system, userPrompt, userId);
}
