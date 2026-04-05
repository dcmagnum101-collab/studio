import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ContactsTable } from './contacts-table'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getContacts() {
  return prisma.contact.findMany({
    include: {
      _count: { select: { clientCases: true, caseContacts: true } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })
}

export default async function ContactsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const contacts = await getContacts()

  const tableData = contacts.map(c => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    fullName: `${c.firstName} ${c.lastName}`,
    type: c.type,
    company: c.company,
    phone: c.phone,
    email: c.email,
    caseCount: c._count.clientCases + c._count.caseContacts,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-white">Contacts</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">{contacts.length} contacts</p>
        </div>
        <button className="flex items-center gap-1.5 bg-[#C9A84C] hover:bg-[#b8953e] text-[#0A1628] font-semibold text-xs px-3 py-1.5 rounded transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Add Contact
        </button>
      </div>
      <div className="bg-[#0D1421] border border-[#1a2332] rounded-lg overflow-hidden">
        <ContactsTable data={tableData} />
      </div>
    </div>
  )
}
