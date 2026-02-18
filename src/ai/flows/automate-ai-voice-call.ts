'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating personalized AI voice call and voicemail scripts.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomateAIVoiceCallInputSchema = z.object({
  contactName: z.string().describe('The name of the contact to call.'),
  contactPhoneNumber: z.string().describe('The phone number of the contact.'),
  sellerMotivation: z
    .string()
    .describe(
      'The motivation of the seller, e.g., "moving out of state", "inherited property", "needs quick sale".'
    ),
  propertyAddress: z.string().describe('The address of the property being discussed.'),
});
export type AutomateAIVoiceCallInput = z.infer<
  typeof AutomateAIVoiceCallInputSchema
>;

const AutomateAIVoiceCallOutputSchema = z.object({
  callScript: z
    .string()
    .describe('A personalized script for the AI to use during the voice call.'),
  voicemailScript: z
    .string()
    .describe(
      'A personalized script for the AI to leave as a voicemail if the call is unanswered.'
    ),
});
export type AutomateAIVoiceCallOutput = z.infer<
  typeof AutomateAIVoiceCallOutputSchema
>;

const automateAIVoiceCallPrompt = ai.definePrompt({
  name: 'automateAIVoiceCallPrompt',
  input: {schema: AutomateAIVoiceCallInputSchema},
  output: {schema: AutomateAIVoiceCallOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an AI sales agent designed to make personalized voice calls to potential sellers.
Your goal is to sound natural, empathetic, and persuasive.

Based on the provided contact details and seller motivation, generate two scripts:
1.  A call script for when the person answers the phone. This script should introduce yourself, mention the property, gently inquire about their selling situation, and aim to schedule a follow-up. Make it conversational and natural, not robotic.
2.  A voicemail script for when the call goes to voicemail. This script should be concise, professional, state your purpose, mention the property address, and provide clear contact information for a callback.

Contact Name: {{{contactName}}}
Contact Phone Number: {{{contactPhoneNumber}}}
Seller Motivation: {{{sellerMotivation}}}
Property Address: {{{propertyAddress}}}
`,
});

const automateAIVoiceCallFlow = ai.defineFlow(
  {
    name: 'automateAIVoiceCallFlow',
    inputSchema: AutomateAIVoiceCallInputSchema,
    outputSchema: AutomateAIVoiceCallOutputSchema,
  },
  async input => {
    const {output} = await automateAIVoiceCallPrompt(input);
    if (!output) {
      throw new Error('Failed to generate call and voicemail scripts.');
    }
    return output;
  }
);

export async function automateAIVoiceCall(
  input: AutomateAIVoiceCallInput
): Promise<AutomateAIVoiceCallOutput> {
  return automateAIVoiceCallFlow(input);
}
