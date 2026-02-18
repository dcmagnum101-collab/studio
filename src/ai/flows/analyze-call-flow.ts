
'use server';
/**
 * @fileOverview A Genkit flow for analyzing real estate call transcripts and providing intelligence.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCallInputSchema = z.object({
  contactName: z.string().describe('The name of the contact.'),
  transcript: z.string().describe('The transcript of the call.'),
  duration: z.number().describe('Duration of the call in seconds.'),
  outcome: z.string().describe('The manually selected outcome of the call.'),
});
export type AnalyzeCallInput = z.infer<typeof AnalyzeCallInputSchema>;

const AnalyzeCallOutputSchema = z.object({
  summary: z.string().describe('A 2-3 sentence summary of the call.'),
  sentiment: z.enum(['positive', 'neutral', 'negative']).describe('The overall sentiment of the prospect.'),
  urgency: z.enum(['hot', 'warm', 'cold', 'nurture']).describe('The calculated urgency to sell.'),
  keyPoints: z.array(z.string()).describe('List of main points discussed.'),
  objections: z.array(z.string()).describe('Objections raised by the prospect.'),
  nextBestAction: z.string().describe('The recommended next step for the agent.'),
  coachingTip: z.string().describe('A tip for the agent to improve their performance.'),
});
export type AnalyzeCallOutput = z.infer<typeof AnalyzeCallOutputSchema>;

export async function analyzeCall(input: AnalyzeCallInput): Promise<AnalyzeCallOutput> {
  return analyzeCallFlow(input);
}

const analyzeCallPrompt = ai.definePrompt({
  name: 'analyzeCallPrompt',
  input: {schema: AnalyzeCallInputSchema},
  output: {schema: AnalyzeCallOutputSchema},
  prompt: `You are an expert real estate sales coach analyzing a call made by Monica Selvaggio to a potential seller named {{{contactName}}}.

Call transcript: {{{transcript}}}
Call duration: {{{duration}}} seconds
Manually selected outcome: {{{outcome}}}

Analyze the call to determine the seller's intent, motivation, and personality.
Identify any specific timeline pressures mentioned (e.g., divorce, job transfer).
Assess the sentiment based on tone and responsiveness in the transcript.

Return a detailed analysis with a clear next step that Monica should take to advance the deal.
`,
});

const analyzeCallFlow = ai.defineFlow(
  {
    name: 'analyzeCallFlow',
    inputSchema: AnalyzeCallInputSchema,
    outputSchema: AnalyzeCallOutputSchema,
  },
  async input => {
    const {output} = await analyzeCallPrompt(input);
    if (!output) {
      throw new Error('Failed to analyze call.');
    }
    return output;
  }
);
