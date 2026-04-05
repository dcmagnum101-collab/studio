import { NextResponse } from 'next/server'
import { verifyZapierSecret, processInboundWebhook } from '@/lib/integrations/zapier'
import type { ZapierInboundPayload } from '@/lib/integrations/zapier'

export async function POST(request: Request) {
  if (!verifyZapierSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as ZapierInboundPayload

  try {
    const result = await processInboundWebhook(body)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
