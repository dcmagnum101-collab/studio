import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-guard'
import { syncInvoices } from '@/lib/integrations/quickbooks'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 55

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, { success: boolean; records: number; error?: string }> = {}

  // QuickBooks sync
  try {
    const qbResult = await syncInvoices()
    results.quickbooks = {
      success: qbResult.success,
      records: qbResult.recordsSynced,
      error: qbResult.errors.join('; ') || undefined,
    }
    await prisma.integrationSync.create({
      data: {
        system: 'quickbooks',
        status: qbResult.success ? 'success' : 'partial',
        message: qbResult.errors.join('; ') || 'Sync completed',
        records: qbResult.recordsSynced,
      },
    })
  } catch (err) {
    results.quickbooks = { success: false, records: 0, error: (err as Error).message }
    await prisma.integrationSync.create({
      data: {
        system: 'quickbooks',
        status: 'failed',
        message: (err as Error).message,
        records: 0,
      },
    })
  }

  return NextResponse.json({
    success: true,
    syncedAt: new Date().toISOString(),
    results,
  })
}
