
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * API Route to log AI usage metrics.
 * Called by server actions to track token consumption per user.
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      model, 
      prompt_tokens, 
      completion_tokens, 
      total_tokens, 
      feature 
    } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await adminDb
      .collection('users')
      .doc(userId)
      .collection('ai_usage')
      .add({
        model: model || 'grok-4-latest',
        prompt_tokens: prompt_tokens || 0,
        completion_tokens: completion_tokens || 0,
        total_tokens: total_tokens || 0,
        feature: feature || 'unknown',
        called_at: admin.firestore.FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Usage Log API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
