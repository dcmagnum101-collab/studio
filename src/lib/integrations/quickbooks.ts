import { prisma } from '@/lib/prisma'
import type { SyncResult } from './types'

const QB_BASE_URL = 'https://quickbooks.api.intuit.com/v3/company'

async function getAccessToken(): Promise<string> {
  // In production: check expiry, refresh if needed
  return process.env.QUICKBOOKS_ACCESS_TOKEN!
}

async function qbRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const token = await getAccessToken()
  const realmId = process.env.QUICKBOOKS_REALM_ID!
  const url = `${QB_BASE_URL}/${realmId}${path}`

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    throw new Error(`QuickBooks API error: ${res.status} ${await res.text()}`)
  }

  return res.json()
}

export async function syncInvoices(): Promise<SyncResult> {
  const errors: string[] = []
  let synced = 0

  const invoices = await prisma.invoice.findMany({
    where: { qbInvoiceId: null, status: { not: 'VOID' } },
    include: { case: { include: { client: true } } },
  })

  for (const invoice of invoices) {
    try {
      const lineItems = invoice.lineItems as Array<{
        description: string
        hours: number
        rate: number
        amount: number
      }>

      const qbInvoice = {
        Line: lineItems.map(item => ({
          Amount: item.amount,
          DetailType: 'SalesItemLineDetail',
          Description: item.description,
          SalesItemLineDetail: {
            ItemRef: { value: '1', name: 'Legal Services' },
            Qty: item.hours,
            UnitPrice: item.rate,
          },
        })),
        CustomerRef: {
          value: invoice.clientId,
          name: `${invoice.case.client.firstName} ${invoice.case.client.lastName}`,
        },
        DueDate: invoice.dueDate.toISOString().split('T')[0],
      }

      const result = (await qbRequest('POST', '/invoice?operation=create', {
        Invoice: qbInvoice,
      })) as { Invoice: { Id: string } }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { qbInvoiceId: result.Invoice.Id },
      })

      synced++
    } catch (err) {
      errors.push(`Invoice ${invoice.id}: ${(err as Error).message}`)
    }
  }

  return { success: errors.length === 0, recordsSynced: synced, errors, timestamp: new Date() }
}

export async function healthCheck(): Promise<boolean> {
  try {
    await qbRequest('GET', '/companyinfo/' + process.env.QUICKBOOKS_REALM_ID)
    return true
  } catch {
    return false
  }
}
