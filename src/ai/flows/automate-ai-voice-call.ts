
'use server';
/**
 * @fileOverview Refactored to use Grok (xAI) for Vapi call scripts.
 */

import { grokJSON } from '@/services/grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';
import { z } from 'zod';

const AutomateAIVoiceCallOutputSchema = z.object({
  callScript: z.string(),
  voicemailScript: z.string(),
});

export type AutomateAIVoiceCallOutput = z.infer<typeof AutomateAIVoiceCallOutputSchema>;

export async function automateAIVoiceCall(input: {
  contactName: string;
  contactPhoneNumber: string;
  sellerMotivation: string;
  propertyAddress: string;
}): Promise<AutomateAIVoiceCallOutput> {
  const system = `${monicaSystemPrompt}\n\nWrite a natural, human-sounding phone script and voicemail for an automated voice session. Return JSON only.`;
  const user = `Generate scripts for:
  Name: ${input.contactName}
  Motivation: ${input.sellerMotivation}
  Address: ${input.propertyAddress}`;

  return grokJSON<AutomateAIVoiceCallOutput>(system, user);
}
