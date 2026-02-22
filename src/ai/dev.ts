import { config } from 'dotenv';
config();

import '@/ai/flows/generate-personalized-email.ts';
import '@/ai/flows/generate-personalized-sms-flow.ts';
import '@/ai/flows/analyze-call-flow.ts';
import '@/ai/flows/generate-reminders-flow.ts';
