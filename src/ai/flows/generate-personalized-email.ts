'use server';
/**
 * @fileOverview A Genkit flow for generating personalized outreach emails to potential sellers.
 *
 * - generatePersonalizedEmail - A function that handles the email generation process.
 * - GeneratePersonalizedEmailInput - The input type for the generatePersonalizedEmail function.
 * - GeneratePersonalizedEmailOutput - The return type for the generatePersonalizedEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedEmailInputSchema = z.object({
  contactName: z.string().describe("The potential seller's name."),
  contactEmail: z.string().email().describe("The potential seller's email address."),
  propertyName: z.string().describe('The address or name of the property.'),
  sellerMotivation: z
    .string()
    .describe('The primary motivation for the seller to sell the property.'),
  companyName: z.string().describe('The name of the company sending the email.'),
  agentName: z.string().describe('The name of the sales agent sending the email.'),
});
export type GeneratePersonalizedEmailInput = z.infer<
  typeof GeneratePersonalizedEmailInputSchema
>;

const GeneratePersonalizedEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the personalized outreach email.'),
  body: z.string().describe('The full body of the personalized outreach email.'),
});
export type GeneratePersonalizedEmailOutput = z.infer<
  typeof GeneratePersonalizedEmailOutputSchema
>;

export async function generatePersonalizedEmail(
  input: GeneratePersonalizedEmailInput
): Promise<GeneratePersonalizedEmailOutput> {
  return generatePersonalizedEmailFlow(input);
}

const personalizedEmailPrompt = ai.definePrompt({
  name: 'personalizedEmailPrompt',
  input: {schema: GeneratePersonalizedEmailInputSchema},
  output: {schema: GeneratePersonalizedEmailOutputSchema},
  prompt: `You are an expert sales agent for a company named '{{{companyName}}}' specializing in buying properties directly from sellers.
Your goal is to write a highly personalized, warm, and professional outreach email to a potential seller to gauge their interest in selling their property.

Use the following information to craft the email:

Seller's Name: {{{contactName}}}
Seller's Email: {{{contactEmail}}}
Property Name/Address: {{{propertyName}}}
Seller's Motivation: {{{sellerMotivation}}}
Your Name (Agent): {{{agentName}}}
Company Name: {{{companyName}}}

Craft an email that includes a compelling subject line and a persuasive body. The email should:
- Be friendly and respectful.
- Briefly mention the property and acknowledge the seller's potential motivation.
- Offer a clear, no-obligation solution for selling.
- Include a call to action to discuss further.
- Ensure all provided details (name, property, motivation) are seamlessly integrated.
- The tone should be professional yet approachable.

Subject: Start with a personal touch and a clear value proposition.
Body: Be concise, clear, and focused on the seller's benefit.
`,
});

const generatePersonalizedEmailFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedEmailFlow',
    inputSchema: GeneratePersonalizedEmailInputSchema,
    outputSchema: GeneratePersonalizedEmailOutputSchema,
  },
  async input => {
    const {output} = await personalizedEmailPrompt(input);
    if (!output) {
      throw new Error('Failed to generate personalized email.');
    }
    return output;
  }
);
