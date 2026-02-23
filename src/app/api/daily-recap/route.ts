
import { NextRequest, NextResponse } from 'next/server';
import { generateDailyRecap } from '@/app/actions/goals';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Triggered at 6 PM daily to audit agent performance.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const result = await generateDailyRecap(userId);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[Recap API] Critical failure:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
