'use server';

import { grokJSON } from '@/services/grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';

export interface ObjectionCoachOutput {
  empathy: string;
  response: string;
  redirect: string;
  avoid: string;
}

/**
 * Uses Grok to generate a tactical real estate objection response.
 */
export async function getLiveCoaching(payload: {
  objection: string;
  leadType: string;
  userId: string;
}): Promise<ObjectionCoachOutput> {
  const { objection, leadType, userId } = payload;

  const system = `${monicaSystemPrompt}
  You are Monica Selvaggio's elite sales coach. 
  An agent just heard an objection from a ${leadType} lead.
  Provide a tactical, high-leverage response.
  
  Format as JSON:
  {
    "empathy": "A short sentence acknowledging their feeling without agreeing with the objection",
    "response": "A confident, 2-3 sentence response in Monica's voice (tactical, professional, focused on results)",
    "redirect": "A powerful follow-up question to take back control of the conversation",
    "avoid": "One specific thing the agent should NOT say in this scenario"
  }`;

  const userPrompt = `Objection: "${objection}"\nLead Type: ${leadType}`;

  try {
    return await grokJSON<ObjectionCoachOutput>(system, userPrompt, userId);
  } catch (error) {
    console.error('[Objection Coach] AI failed:', error);
    throw new Error('Monica is offline. Try the pre-built library.');
  }
}
