import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Legacy route — deprecated in favor of /api/cron/nightly-report
export async function POST() {
  return NextResponse.json({ message: 'Use /api/cron/nightly-report instead' }, { status: 410 })
}

export async function GET() {
  return NextResponse.json({ message: 'Use /api/cron/nightly-report instead' }, { status: 410 })
}
