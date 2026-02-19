
'use server';
/**
 * @fileOverview Refactored to use Grok (xAI) for task suggestions.
 */

import { grokJSON } from '@/services/grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';
import { z } from 'zod';

const TaskSchema = z.object({
  type: z.enum(['call', 'email', 'sms', 'appointment', 'custom']),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']),
  dueInDays: z.number(),
  aiReason: z.string(),
});

const GenerateRemindersOutputSchema = z.object({
  tasks: z.array(TaskSchema),
});

export type GenerateRemindersOutput = z.infer<typeof GenerateRemindersOutputSchema>;

export async function generateReminders(input: {
  contactName: string;
  pipelineStage: string;
  lastActivityOutcome: string;
  aiUrgency: 'hot' | 'warm' | 'cold' | 'nurture';
  notes?: string;
}): Promise<GenerateRemindersOutput> {
  const system = `${monicaSystemPrompt}\n\nYou are Monica's AI sales manager. Suggest 1-3 specific follow-up tasks to advance the deal. Return JSON only.`;
  const user = `Suggest tasks for ${input.contactName} at stage ${input.pipelineStage}. 
  Last outcome: ${input.lastActivityOutcome}. 
  Urgency: ${input.aiUrgency}. 
  Notes: ${input.notes || 'None'}`;

  return grokJSON<GenerateRemindersOutput>(system, user);
}
