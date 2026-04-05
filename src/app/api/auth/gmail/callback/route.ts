import { NextResponse } from 'next/server'

// Legacy Firebase-based Gmail OAuth — not used in current architecture
export async function GET() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
