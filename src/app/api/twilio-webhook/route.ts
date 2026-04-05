import { NextResponse } from 'next/server'

// Legacy Firebase route — deprecated
export async function GET() {
  return NextResponse.json({ error: 'Deprecated' }, { status: 410 })
}
export async function POST() {
  return NextResponse.json({ error: 'Deprecated' }, { status: 410 })
}
