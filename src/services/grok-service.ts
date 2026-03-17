
'use server';

/**
 * @fileOverview Grok (xAI) completion service.
 * Refactored to be SDK-agnostic. Logs usage via internal API.
 */

const GROK_API_KEY = process.env.GROK_API_KEY!;
const GROK_BASE_URL = process.env.GROK_BASE_URL || 'https://api.x.ai/v1';
const GROK_MODEL = process.env.GROK_MODEL || 'grok-4-latest';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokOptions {
  userId?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Core completion function for Grok (xAI).
 */
export async function grokComplete(
  messages: Message[],
  options: GrokOptions = {}
): Promise<string> {
  if (!process.env.GROK_API_KEY) {
    throw new Error('Grok API key not configured. Add GROK_API_KEY to App Hosting environment secrets.');
  }

  const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages,
      stream: false,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  // Log usage via internal API route (non-blocking)
  if (options.userId) {
    const logUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/log-ai-usage`;
    fetch(logUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: options.userId,
        model: GROK_MODEL,
        prompt_tokens: data.usage?.prompt_tokens,
        completion_tokens: data.usage?.completion_tokens,
        total_tokens: data.usage?.total_tokens,
        feature: messages[0]?.content.slice(0, 50) || 'chat',
      }),
    }).catch(err => console.error('[Grok] Failed to fire usage log:', err));
  }

  return data.choices[0].message.content;
}

/**
 * Shortcut for a simple system/user prompt pair.
 */
export async function grokAsk(
  systemPrompt: string,
  userPrompt: string,
  userId?: string,
  temperature = 0.7
): Promise<string> {
  if (!process.env.GROK_API_KEY) {
    throw new Error('Grok API key not configured. Add GROK_API_KEY to App Hosting environment secrets.');
  }

  return grokComplete([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature, userId });
}

/**
 * Shortcut for requesting a structured JSON response.
 */
export async function grokJSON<T = any>(
  systemPrompt: string,
  userPrompt: string,
  userId?: string
): Promise<T> {
  if (!process.env.GROK_API_KEY) {
    throw new Error('Grok API key not configured. Add GROK_API_KEY to App Hosting environment secrets.');
  }

  const result = await grokAsk(
    systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no backticks, no explanation.',
    userPrompt,
    userId,
    0.2 // Low temperature for structured output
  );
  
  try {
    return JSON.parse(result) as T;
  } catch {
    const clean = result
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(clean) as T;
  }
}
