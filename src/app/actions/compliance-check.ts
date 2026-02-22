'use server';

import { grokJSON } from '@/services/grok-service';

export interface ComplianceResult {
  approved: boolean;
  risk_level: 'clear' | 'low' | 'medium' | 'high';
  flags: string[];
  suggestions: string[];
  corrected_content: string;
}

/**
 * Analyzes real estate outreach content for NAR and Fair Housing compliance.
 */
export async function checkCompliance(payload: {
  content: string;
  type: 'email' | 'sms' | 'script';
  contactName: string;
  userId: string;
}): Promise<ComplianceResult> {
  const { content, type, contactName, userId } = payload;

  const system = `You are a licensed NAR compliance officer and Fair Housing Act specialist.
Review the following real estate outreach content for violations of:
1. Fair Housing Act — no references to race, color, religion, sex, national origin, disability, familial status, or neighborhood demographic characteristics.
2. Steering language — directing people toward or away from areas based on protected characteristics.
3. Agent disclosure — first contact must clearly identify sender as a licensed real estate agent and their brokerage.
4. AI disclosure — if AI-generated, must note 'This message was drafted with AI assistance'.
5. RESPA compliance — no referral fee implications or kickback language.
6. Deceptive claims — no guaranteed price promises or misleading market data.
7. DNC compliance language — SMS must include opt-out instructions (e.g., "Reply STOP to unsubscribe").

Return ONLY valid JSON:
{ 
  "approved": boolean,
  "risk_level": "clear" | "low" | "medium" | "high",
  "flags": string[],
  "suggestions": string[],
  "corrected_content": string
}`;

  const userPrompt = `Content Type: ${type}
Target Recipient: ${contactName}
Content: "${content}"`;

  try {
    return await grokJSON<ComplianceResult>(system, userPrompt, userId);
  } catch (error) {
    console.error('[Compliance Action] AI check failed:', error);
    // Fallback to a safe "needs review" state if AI fails
    return {
      approved: false,
      risk_level: 'medium',
      flags: ['Internal compliance engine timeout'],
      suggestions: ['Please manually verify agent and brokerage disclosures.'],
      corrected_content: content
    };
  }
}
