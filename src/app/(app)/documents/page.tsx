import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DocumentsTable } from './documents-table'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDocuments() {
  return prisma.document.findMany({
    include: {
      case: { select: { id: true, caseNumber: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function DocumentsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const docs = await getDocuments()

  const tableData = docs.map(d => ({
    id: d.id,
    name: d.name,
    category: d.category,
    caseId: d.case.id,
    caseNumber: d.case.caseNumber,
    caseTitle: d.case.title,
    uploadedBy: d.uploadedBy,
    size: d.size,
    mimeType: d.mimeType,
    url: d.url,
    createdAt: d.createdAt.toISOString(),
    signedAt: d.signedAt?.toISOString() ?? null,
  }))

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-white">Documents</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">{docs.length} documents</p>
        </div>
      </div>
      <div className="bg-[#0D1421] border border-[#1a2332] rounded-lg overflow-hidden">
        <DocumentsTable data={tableData} />
      </div>
    </div>
  )
}
