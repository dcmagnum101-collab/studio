'use server';
/**
 * @fileOverview A Genkit flow for generating automated follow-up tasks based on CRM activity.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRemindersInputSchema = z.object({
  contactName: z.string(),
  pipelineStage: z.string(),
  lastActivityOutcome: z.string(),
  aiUrgency: z.enum(['hot', 'warm', 'cold', 'nurture']),
  notes: z.string().optional(),
});
export type GenerateRemindersInput = z.infer<typeof GenerateRemindersInputSchema>;

const TaskSchema = z.object({
  type: z.enum(['call', 'email', 'sms', 'appointment', 'custom']),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']),
  dueInDays: z.number(),
  aiReason: z.string(),
});

const GenerateRemindersOutputSchema = z.object({
  tasks: z.array(TaskSchema).describe('A list of recommended follow-up tasks.'),
});
export type GenerateRemindersOutput = z.infer<typeof GenerateRemindersOutputSchema>;

export async function generateReminders(input: GenerateRemindersInput): Promise<GenerateRemindersOutput> {
  return generateRemindersFlow(input);
}

const generateRemindersPrompt = ai.definePrompt({
  name: 'generateRemindersPrompt',
  input: {schema: GenerateRemindersInputSchema},
  output: {schema: GenerateRemindersOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
  prompt: `You are Monica Selvaggio's AI sales manager. Based on the latest activity with {{{contactName}}}, suggest the ideal follow-up tasks.

Contact Context:
- Pipeline Stage: {{{pipelineStage}}}
- Last Activity Outcome: {{{lastActivityOutcome}}}
- AI Urgency Assessment: {{{aiUrgency}}}
- Monica's Notes: {{{notes}}}

Generate a sequence of 1-3 tasks that Monica should complete to keep the deal moving. 
`,
});

const generateRemindersFlow = ai.defineFlow(
  {
    name: 'generateRemindersFlow',
    inputSchema: GenerateRemindersInputSchema,
    outputSchema: GenerateRemindersOutputSchema,
  },
  async input => {
    const {output} = await generateRemindersPrompt(input);
    if (!output) {
      throw new Error('Failed to generate reminders.');
    }
    return output;
  }
);