import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DocuSign Connect webhook handler
export async function POST(request: Request) {
  const body = await request.text()

  try {
    const data = JSON.parse(body) as {
      event?: string
      data?: {
        envelopeId?: string
        envelopeSummary?: {
          status?: string
          completedDateTime?: string
          envelopeId?: string
        }
      }
    }

    const envelopeId =
      data.data?.envelopeId ?? data.data?.envelopeSummary?.envelopeId
    const status = data.data?.envelopeSummary?.status ?? data.event
    const completedAt = data.data?.envelopeSummary?.completedDateTime

    if (!envelopeId) {
      return NextResponse.json({ received: true })
    }

    // Find document by envelopeId
    if (status === 'completed' && completedAt) {
      await prisma.document.updateMany({
        where: { docusignId: envelopeId },
        data: { signedAt: new Date(completedAt) },
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[docusign/webhook] Parse error:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
