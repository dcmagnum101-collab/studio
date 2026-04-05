import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditCaseWithClaude } from '@/lib/audit/engine'
import { buildAuditInput } from '@/lib/audit/input-builder'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const userId = session.user?.id ?? ''

  const activeCases = await prisma.case.findMany({
    where: { status: 'ACTIVE' },
    include: {
      tasks: true,
      documents: true,
      notes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  const run = await prisma.auditRun.create({
    data: {
      triggeredBy: userId,
      type: 'MANUAL',
      casesScanned: activeCases.length,
      flagsFound: 0,
      riskScore: 0,
    },
  })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      send({ type: 'start', runId: run.id, total: activeCases.length })

      let totalFlags = 0
      let totalRisk = 0
      let processed = 0

      for (const c of activeCases) {
        send({ type: 'progress', caseId: c.id, caseNumber: c.caseNumber, status: 'processing', processed, total: activeCases.length })

        try {
          const input = buildAuditInput(c)
          const report = await auditCaseWithClaude(input)

          if (report.flags.length > 0) {
            await prisma.auditFlag.createMany({
              data: report.flags.map(f => ({
                caseId: c.id,
                runId: run.id,
                type: f.type as never,
                severity: f.severity as never,
                urgency: f.urgency as never,
                title: f.title,
                description: f.description,
                recommendation: f.recommendation,
                isResolved: false,
              })),
            })
          }

          totalFlags += report.flags.length
          totalRisk += report.riskScore
          processed++

          send({
            type: 'progress',
            caseId: c.id,
            caseNumber: c.caseNumber,
            status: 'done',
            riskScore: report.riskScore,
            riskLevel: report.riskLevel,
            flagCount: report.flags.length,
            nextBestAction: report.nextBestAction,
            processed,
            total: activeCases.length,
          })
        } catch (err) {
          processed++
          send({
            type: 'error',
            caseId: c.id,
            caseNumber: c.caseNumber,
            error: (err as Error).message,
            processed,
            total: activeCases.length,
          })
        }
      }

      const avgRisk = activeCases.length > 0 ? totalRisk / activeCases.length : 0

      await prisma.auditRun.update({
        where: { id: run.id },
        data: { flagsFound: totalFlags, riskScore: avgRisk, completedAt: new Date() },
      })

      send({ type: 'complete', runId: run.id, totalFlags, avgRisk: Math.round(avgRisk) })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
