
'use server';

/**
 * @fileOverview Grok (xAI) completion service.
 * OpenAI-compatible format using native fetch.
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const GROK_API_KEY = process.env.GROK_API_KEY!;
const GROK_BASE_URL = process.env.GROK_BASE_URL || 'https://api.x.ai/v1';
const GROK_MODEL = process.env.GROK_MODEL || 'grok-4-latest';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokOptions {
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
  if (!GROK_API_KEY) {
    throw new Error('GROK_API_KEY is not configured.');
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
  
  // Log usage to Firestore for the AI Dashboard
  try {
    // Note: We use client-side db here but in server component context
    // This is fine for server actions.
    await addDoc(collection(db, 'ai_usage'), {
      model: GROK_MODEL,
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0,
      called_at: serverTimestamp(),
      feature: messages[0]?.content.slice(0, 50) || 'unknown',
    });
  } catch (e) {
    console.error('Failed to log AI usage:', e);
  }

  return data.choices[0].message.content;
}

/**
 * Shortcut for a simple system/user prompt pair.
 */
export async function grokAsk(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.7
): Promise<string> {
  return grokComplete([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature });
}

/**
 * Shortcut for requesting a structured JSON response.
 */
export async function grokJSON<T = any>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const result = await grokAsk(
    systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no backticks, no explanation.',
    userPrompt,
    0.2 // Low temperature for structured output
  );
  
  try {
    return JSON.parse(result) as T;
  } catch {
    // Strip any accidental markdown backticks
    const clean = result
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(clean) as T;
  }
}
