
'use server';

import { grokJSON } from '@/services/grok-service';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function analyzeSocialLeadAction(userId: string, payload: { platform: string, content: string, url?: string }) {
  const { platform, content, url } = payload;

  try {
    const system = "You are a real estate social intelligence analyzer. Extract lead details from this post content. Return JSON.";
    const userPrompt = `Platform: ${platform}\nContent: "${content}"`;

    const extraction = await grokJSON<{
      name: string,
      motivation: string,
      urgency: 'hot' | 'warm' | 'cold',
      suggestedOpener: string,
      location?: string
    }>(system, userPrompt, userId);

    const contactRef = await adminDb.collection('users').doc(userId).collection('contacts').add({
      name: extraction.name || 'Social Lead',
      propertyAddress: extraction.location || 'Unknown - Search Required',
      motivation: extraction.motivation,
      ai_urgency: extraction.urgency,
      ai_summary: `Captured from ${platform}: ${content.substring(0, 100)}...`,
      ai_next_best_action: extraction.suggestedOpener,
      archagent_source: 'social_capture',
      pipeline_stage: 'new_lead',
      icpScore: extraction.urgency === 'hot' ? 85 : 60,
      source_evidence: url ? [url] : [],
      ownerId: userId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return { contactId: contactRef.id, success: true };
  } catch (error: any) {
    console.error('[Social Action] Analysis failed:', error);
    throw new Error(error.message);
  }
}

export async function scrapeYouTubeMonitorAction(userId: string, channelUrl: string) {
  // YT API v3 keyword search stub
  return { potentialLeads: [], success: true };
}
