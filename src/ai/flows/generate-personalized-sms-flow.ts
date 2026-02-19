
'use server';
/**
 * @fileOverview Refactored to use Grok (xAI) for SMS generation.
 */

import { grokJSON } from '@/services/grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';
import { z } from 'zod';

const GeneratePersonalizedSMSOutputSchema = z.object({
  smsMessage: z.string(),
});

export type GeneratePersonalizedSMSOutput = z.infer<typeof GeneratePersonalizedSMSOutputSchema>;

export async function generatePersonalizedSMS(input: {
  contactName: string;
  propertyAddress: string;
  estimateInfo: string;
  sellerMotivation?: string;
}): Promise<GeneratePersonalizedSMSOutput> {
  const system = `${monicaSystemPrompt}\n\nWrite a short, conversational text message (max 160 chars). No robot-speak. Return JSON only.`;
  const user = `Write a text to ${input.contactName} about ${input.propertyAddress}. Offer: ${input.estimateInfo}. ${input.sellerMotivation ? `Context: ${input.sellerMotivation}` : ''}`;

  return grokJSON<GeneratePersonalizedSMSOutput>(system, user);
}
