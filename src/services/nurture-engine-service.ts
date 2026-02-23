'use server';

/**
 * @fileOverview AI Nurture Engine Service.
 * Deterministic lead analysis with compliance enforcement and audit logging.
 */

import { grokJSON } from './grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export interface NurtureAnalysis {
  summary: string;
  nextActions: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  draftedMessage?: {
    type: 'email' | 'sms';
    subject?: string;
    body: string;
  };
  compliance: {
    isEligible: boolean;
    reason?: string;
    checks: {
      notUnsubscribed: boolean;
      hasContactInfo: boolean;
      safeTimeWindow: boolean;
    };
  };
}

/**
 * Generates a structured nurture plan for a lead using Admin SDK.
 */
export async function generateNurturePlan(userId: string, contactId: string): Promise<NurtureAnalysis> {
  const contactRef = adminDb.collection('users').doc(userId).collection('contacts').doc(contactId);
  const contactDoc = await contactRef.get();

  if (!contactDoc.exists) {
    throw new Error('Contact not found');
  }

  const lead = contactDoc.data()!;
  
  // Fetch recent messages for context
  const messagesSnap = await adminDb.collection('users')
    .doc(userId)
    .collection('messages')
    .where('leadId', '==', contactId)
    .orderBy('created_at', 'desc')
    .limit(5)
    .get();

  const history = messagesSnap.docs.map(d => ({
    role: d.data().status === 'sent' ? 'assistant' : 'user',
    content: d.data().body,
    subject: d.data().subject
  }));

  // Compliance Logic
  const isUnsubscribed = lead.email_unsubscribed === true;
  const hasEmail = !!lead.email;
  const hour = new Date().getHours();
  const isSafeTime = hour >= 8 && hour <= 20;

  const compliance = {
    isEligible: !isUnsubscribed && hasEmail,
    reason: isUnsubscribed ? 'Recipient Unsubscribed' : (!hasEmail ? 'No Email Address' : undefined),
    checks: {
      notUnsubscribed: !isUnsubscribed,
      hasContactInfo: hasEmail,
      safeTimeWindow: isSafeTime
    }
  };

  const system = `${monicaSystemPrompt}
  You are an AI Nurture Engine. Analyze the lead profile and history to advance the deal.
  
  STRICT RULES:
  1. If compliance.isEligible is false, do NOT draft a message.
  2. Be deterministic and tactical.
  3. Respond ONLY with structured JSON matching the NurtureAnalysis interface.`;

  const userPrompt = `
  Lead Profile: ${JSON.stringify({
    name: lead.name,
    address: lead.propertyAddress,
    motivation: lead.motivation,
    stage: lead.pipeline_stage,
    icpScore: lead.icpScore
  })}

  Recent History: ${JSON.stringify(history)}

  Compliance Status: ${JSON.stringify(compliance)}
  `;

  const analysis = await grokJSON<NurtureAnalysis>(system, userPrompt, userId);

  // Audit Logging
  await contactRef.collection('ai_runs').add({
    run_at: admin.firestore.FieldValue.serverTimestamp(),
    input_context: { lead, history, compliance },
    output: analysis,
    model: 'grok-4-latest'
  });

  return analysis;
}
