
'use server';
/**
 * @fileOverview A Genkit flow for generating personalized SMS messages for potential sellers.
 *
 * - generatePersonalizedSMS - A function that handles the generation of personalized SMS messages.
 * - GeneratePersonalizedSMSInput - The input type for the generatePersonalizedSMS function.
 * - GeneratePersonalizedSMSOutput - The return type for the generatePersonalizedSMS function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedSMSInputSchema = z.object({
  contactName: z.string().describe('The name of the potential seller.'),
  propertyAddress: z
    .string()
    .describe('The address of the potential seller\'s property.'),
  estimateInfo: z
    .string()
    .describe(
      'Details about the free estimate offered, e.g., "We offer a free, no-obligation estimate of your property\'s value."'
    ),
  sellerMotivation: z
    .string()
    .optional()
    .describe(
      'Optional: Information about the seller\'s motivation, if known, to personalize the message further.'
    ),
});
export type GeneratePersonalizedSMSInput = z.infer<
  typeof GeneratePersonalizedSMSInputSchema
>;

const GeneratePersonalizedSMSOutputSchema = z.object({
  smsMessage: z.string().describe('The personalized SMS message for the potential seller.'),
});
export type GeneratePersonalizedSMSOutput = z.infer<
  typeof GeneratePersonalizedSMSOutputSchema
>;

export async function generatePersonalizedSMS(
  input: GeneratePersonalizedSMSInput
): Promise<GeneratePersonalizedSMSOutput> {
  return generatePersonalizedSMSFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedSMSPrompt',
  input: {schema: GeneratePersonalizedSMSInputSchema},
  output: {schema: GeneratePersonalizedSMSOutputSchema},
  prompt: `You are a sales agent generating a personalized SMS message for a potential seller.
Your goal is to create a concise, polite, and effective message that encourages them to engage.
Address the contact by their name if available.
Mention the property address and the free estimate offer.
If seller motivation is provided, use it to make the message more relevant.

Here is the information:
Contact Name: {{{contactName}}}
Property Address: {{{propertyAddress}}}
Free Estimate Information: {{{estimateInfo}}}
{{#if sellerMotivation}}
Seller Motivation: {{{sellerMotivation}}}
{{/if}}

Generated SMS:`,
});

const generatePersonalizedSMSFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedSMSFlow',
    inputSchema: GeneratePersonalizedSMSInputSchema,
    outputSchema: GeneratePersonalizedSMSOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate SMS message.');
    }
    return output;
  }
);
