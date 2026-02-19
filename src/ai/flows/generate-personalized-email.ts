
'use server';
/**
 * @fileOverview Refactored to use Grok (xAI) for email generation.
 */

import { grokJSON } from '@/services/grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';
import { z } from 'zod';

const GeneratePersonalizedEmailOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export type GeneratePersonalizedEmailOutput = z.infer<typeof GeneratePersonalizedEmailOutputSchema>;

export async function generatePersonalizedEmail(input: {
  contactName: string;
  contactEmail: string;
  propertyName: string;
  sellerMotivation: string;
  companyName: string;
  agentName: string;
}): Promise<GeneratePersonalizedEmailOutput> {
  const system = `${monicaSystemPrompt}\n\nWrite a warm, professional, and personalized outreach email. No fluff. Return JSON only with subject and body.`;
  const user = `Write an outreach email to ${input.contactName} regarding their property at ${input.propertyName}. 
  Motivation context: ${input.sellerMotivation}`;

  return grokJSON<GeneratePersonalizedEmailOutput>(system, user);
}
