
'use server';
/**
 * @fileOverview Refactored to use Grok (xAI) for call analysis.
 */

import { grokJSON } from '@/services/grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';
import { z } from 'zod';

const AnalyzeCallOutputSchema = z.object({
  summary: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  urgency: z.enum(['hot', 'warm', 'cold', 'nurture']),
  keyPoints: z.array(z.string()),
  objections: z.array(z.string()),
  nextBestAction: z.string(),
  coachingTip: z.string(),
});

export type AnalyzeCallOutput = z.infer<typeof AnalyzeCallOutputSchema>;

export async function analyzeCall(input: {
  contactName: string;
  transcript: string;
  duration: number;
  outcome: string;
}): Promise<AnalyzeCallOutput> {
  const system = `${monicaSystemPrompt}\n\nYou are an expert real estate sales coach analyzing a call transcript. Extract key insights and return structured JSON.`;
  const user = `Analyze this call made by Monica to ${input.contactName}.
  
  Transcript: ${input.transcript}
  Duration: ${input.duration}s
  Manual Outcome: ${input.outcome}`;

  return grokJSON<AnalyzeCallOutput>(system, user);
}
