import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays, subDays, subMonths } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Padda Legal Intelligence...')

  // ─── Users ───────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('PaddaLaw2026!', 12)

  const paul = await prisma.user.upsert({
    where: { email: 'paul@paddalaw.com' },
    update: {},
    create: {
      name: 'Paul Padda',
      email: 'paul@paddalaw.com',
      password: passwordHash,
      role: 'ADMIN',
      phone: '+17025550001',
      notifyMorning: true,
      notifyNightly: true,
      notifyAlerts: true,
      notifySMS: true,
    },
  })

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@paddalaw.com' },
    update: {},
    create: {
      name: 'Sarah Chen',
      email: 'sarah@paddalaw.com',
      password: passwordHash,
      role: 'ATTORNEY',
      phone: '+17025550002',
      notifyMorning: true,
      notifyAlerts: true,
    },
  })

  const mike = await prisma.user.upsert({
    where: { email: 'mike@paddalaw.com' },
    update: {},
    create: {
      name: 'Michael Torres',
      email: 'mike@paddalaw.com',
      password: passwordHash,
      role: 'ATTORNEY',
      notifyMorning: true,
    },
  })

  const jessica = await prisma.user.upsert({
    where: { email: 'jessica@paddalaw.com' },
    update: {},
    create: {
      name: 'Jessica Rivera',
      email: 'jessica@paddalaw.com',
      password: passwordHash,
      role: 'PARALEGAL',
      notifyMorning: true,
      notifyAlerts: true,
    },
  })

  const david = await prisma.user.upsert({
    where: { email: 'david@paddalaw.com' },
    update: {},
    create: {
      name: 'David Kim',
      email: 'david@paddalaw.com',
      password: passwordHash,
      role: 'PARALEGAL',
    },
  })

  console.log('✅ Users created')

  // ─── Contacts (Clients) ──────────────────────────────────────
  const clients = await Promise.all([
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Marcus', lastName: 'Johnson', email: 'marcus.j@email.com', phone: '7025551001', city: 'Las Vegas', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Elena', lastName: 'Vasquez', email: 'elena.v@email.com', phone: '7025551002', city: 'Henderson', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Robert', lastName: 'Nguyen', email: 'robert.n@email.com', phone: '7025551003', city: 'Las Vegas', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Patricia', lastName: 'Williams', email: 'pat.w@email.com', phone: '7025551004', city: 'North Las Vegas', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'James', lastName: 'Morrison', email: 'james.m@email.com', phone: '7025551005', city: 'Las Vegas', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Linda', lastName: 'Chen', email: 'linda.c@email.com', phone: '7025551006', city: 'Summerlin', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Anthony', lastName: 'Davis', email: 'tony.d@email.com', phone: '7025551007', city: 'Las Vegas', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Maria', lastName: 'Gonzalez', email: 'maria.g@email.com', phone: '7025551008', city: 'Henderson', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Thomas', lastName: 'Brown', email: 'tom.b@email.com', phone: '7025551009', city: 'Las Vegas', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Sandra', lastName: 'Martinez', email: 'sandra.m@email.com', phone: '7025551010', city: 'Boulder City', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Kevin', lastName: 'Thompson', email: 'kevin.t@email.com', phone: '7025551011', city: 'Las Vegas', state: 'NV' } }),
    prisma.contact.create({ data: { type: 'CLIENT', firstName: 'Dorothy', lastName: 'Lee', email: 'dorothy.l@email.com', phone: '7025551012', city: 'Henderson', state: 'NV' } }),
  ])

  // Opposing counsel
  const opposingCounsel = await Promise.all([
    prisma.contact.create({ data: { type: 'OPPOSING_COUNSEL', firstName: 'Richard', lastName: 'Blake', company: 'State Farm Legal Dept', phone: '7025552001', barNumber: 'NV12345' } }),
    prisma.contact.create({ data: { type: 'OPPOSING_COUNSEL', firstName: 'Catherine', lastName: 'Walsh', company: 'Allstate Defense Counsel', phone: '7025552002', barNumber: 'NV23456' } }),
    prisma.contact.create({ data: { type: 'OPPOSING_COUNSEL', firstName: 'Harold', lastName: 'Pine', company: 'GEICO Legal', phone: '7025552003', barNumber: 'NV34567' } }),
  ])

  // Insurance adjusters
  const adjusters = await Promise.all([
    prisma.contact.create({ data: { type: 'ADJUSTER', firstName: 'Nancy', lastName: 'Cooper', company: 'State Farm', phone: '8005551001' } }),
    prisma.contact.create({ data: { type: 'ADJUSTER', firstName: 'Brian', lastName: 'Foster', company: 'Progressive', phone: '8005551002' } }),
  ])

  // Medical providers
  const medProviders = await Promise.all([
    prisma.contact.create({ data: { type: 'MEDICAL_PROVIDER', firstName: 'Dr. Jennifer', lastName: 'Park', company: 'Desert Springs Medical', phone: '7025553001' } }),
    prisma.contact.create({ data: { type: 'MEDICAL_PROVIDER', firstName: 'Dr. Carlos', lastName: 'Reyes', company: 'Vegas Orthopedic Center', phone: '7025553002' } }),
  ])

  console.log('✅ Contacts created')

  // ─── Cases ───────────────────────────────────────────────────
  const now = new Date()

  const caseData = [
    // CRITICAL SOL cases
    {
      caseNumber: 'PPL-2024-10001', title: 'Johnson v. Clark County Transit',
      type: 'AUTO_ACCIDENT', stage: 'NEGOTIATION', priority: 'CRITICAL',
      clientId: clients[0].id, assignedToId: paul.id,
      incidentDate: subMonths(now, 22), statute: addDays(now, 4),
      estimatedValue: 285000, stageEnteredAt: subDays(now, 45),
    },
    {
      caseNumber: 'PPL-2024-10002', title: 'Vasquez v. Bellagio Hotel & Casino',
      type: 'SLIP_AND_FALL', stage: 'DEMAND', priority: 'HIGH',
      clientId: clients[1].id, assignedToId: sarah.id,
      incidentDate: subMonths(now, 18), statute: addDays(now, 12),
      estimatedValue: 145000, stageEnteredAt: subDays(now, 30),
    },
    // High-value active cases
    {
      caseNumber: 'PPL-2024-10003', title: 'Nguyen v. Harrah\'s Entertainment',
      type: 'PREMISES_LIABILITY', stage: 'LITIGATION', priority: 'HIGH',
      clientId: clients[2].id, assignedToId: paul.id,
      incidentDate: subMonths(now, 14), statute: addDays(now, 310),
      estimatedValue: 750000, stageEnteredAt: subDays(now, 60),
    },
    {
      caseNumber: 'PPL-2024-10004', title: 'Williams v. Southwest Airlines',
      type: 'PERSONAL_INJURY', stage: 'INVESTIGATION', priority: 'HIGH',
      clientId: clients[3].id, assignedToId: mike.id,
      incidentDate: subMonths(now, 8), statute: addDays(now, 490),
      estimatedValue: 520000, stageEnteredAt: subDays(now, 20),
    },
    {
      caseNumber: 'PPL-2025-10005', title: 'Morrison v. MGM Resorts',
      type: 'WRONGFUL_DEATH', stage: 'DEMAND', priority: 'CRITICAL',
      clientId: clients[4].id, assignedToId: paul.id,
      incidentDate: subMonths(now, 10), statute: addDays(now, 365),
      estimatedValue: 1200000, stageEnteredAt: subDays(now, 14),
    },
    // Mid-pipeline cases
    {
      caseNumber: 'PPL-2025-10006', title: 'Chen v. Nevada DOT',
      type: 'AUTO_ACCIDENT', stage: 'INVESTIGATION', priority: 'MEDIUM',
      clientId: clients[5].id, assignedToId: sarah.id,
      incidentDate: subMonths(now, 5), statute: addDays(now, 550),
      estimatedValue: 95000, stageEnteredAt: subDays(now, 10),
    },
    {
      caseNumber: 'PPL-2025-10007', title: 'Davis v. Sunrise Hospital',
      type: 'MEDICAL_MALPRACTICE', stage: 'INTAKE', priority: 'HIGH',
      clientId: clients[6].id, assignedToId: mike.id,
      incidentDate: subMonths(now, 3), statute: addDays(now, 640),
      estimatedValue: 380000, stageEnteredAt: subDays(now, 5),
    },
    {
      caseNumber: 'PPL-2025-10008', title: 'Gonzalez v. Amazon Delivery',
      type: 'AUTO_ACCIDENT', stage: 'NEGOTIATION', priority: 'MEDIUM',
      clientId: clients[7].id, assignedToId: sarah.id,
      incidentDate: subMonths(now, 12), statute: addDays(now, 365),
      estimatedValue: 68000, stageEnteredAt: subDays(now, 35),
      settlementOffer: 42000,
    },
    {
      caseNumber: 'PPL-2025-10009', title: 'Brown v. Walmart Nevada',
      type: 'SLIP_AND_FALL', stage: 'DEMAND', priority: 'MEDIUM',
      clientId: clients[8].id, assignedToId: jessica.id,
      incidentDate: subMonths(now, 9), statute: addDays(now, 460),
      estimatedValue: 55000, stageEnteredAt: subDays(now, 21),
    },
    {
      caseNumber: 'PPL-2025-10010', title: 'Martinez v. Construction Zone Negligence',
      type: 'PERSONAL_INJURY', stage: 'INTAKE', priority: 'HIGH',
      clientId: clients[9].id, assignedToId: paul.id,
      incidentDate: subMonths(now, 2), statute: addDays(now, 730),
      estimatedValue: 210000, stageEnteredAt: subDays(now, 3),
    },
    // Stalled cases
    {
      caseNumber: 'PPL-2024-10011', title: 'Thompson v. Republic Services',
      type: 'WORKERS_COMP', stage: 'INVESTIGATION', priority: 'MEDIUM',
      clientId: clients[10].id, assignedToId: mike.id,
      incidentDate: subMonths(now, 16), statute: addDays(now, 200),
      estimatedValue: 125000, stageEnteredAt: subDays(now, 95), // stalled
    },
    {
      caseNumber: 'PPL-2024-10012', title: 'Lee v. CCSD School Bus',
      type: 'PERSONAL_INJURY', stage: 'NEGOTIATION', priority: 'HIGH',
      clientId: clients[11].id, assignedToId: sarah.id,
      incidentDate: subMonths(now, 20), statute: addDays(now, 60),
      estimatedValue: 180000, stageEnteredAt: subDays(now, 110), // stalled
    },
    // Recently settled
    {
      caseNumber: 'PPL-2023-09801', title: 'Rodriguez v. Venetian Resort',
      type: 'SLIP_AND_FALL', stage: 'CLOSED', priority: 'MEDIUM',
      clientId: clients[0].id, assignedToId: paul.id,
      incidentDate: subMonths(now, 30), statute: subMonths(now, 6),
      estimatedValue: 95000, settlementFinal: 87500,
      stageEnteredAt: subMonths(now, 2),
      dateClosed: subMonths(now, 2),
    },
    {
      caseNumber: 'PPL-2023-09802', title: 'Garcia v. Lyft Inc.',
      type: 'AUTO_ACCIDENT', stage: 'CLOSED', priority: 'HIGH',
      clientId: clients[1].id, assignedToId: sarah.id,
      incidentDate: subMonths(now, 28), statute: subMonths(now, 4),
      estimatedValue: 220000, settlementFinal: 195000,
      stageEnteredAt: subMonths(now, 3),
      dateClosed: subMonths(now, 3),
    },
    // More active cases to reach 20
    {
      caseNumber: 'PPL-2025-10013', title: 'Wilson v. Uber Technologies',
      type: 'AUTO_ACCIDENT', stage: 'INTAKE', priority: 'MEDIUM',
      clientId: clients[2].id, assignedToId: jessica.id,
      incidentDate: subMonths(now, 1), statute: addDays(now, 730),
      estimatedValue: 75000, stageEnteredAt: subDays(now, 2),
    },
    {
      caseNumber: 'PPL-2025-10014', title: 'Jackson v. Caesars Palace',
      type: 'PREMISES_LIABILITY', stage: 'INVESTIGATION', priority: 'HIGH',
      clientId: clients[3].id, assignedToId: mike.id,
      incidentDate: subMonths(now, 6), statute: addDays(now, 550),
      estimatedValue: 315000, stageEnteredAt: subDays(now, 18),
    },
    {
      caseNumber: 'PPL-2025-10015', title: 'Harris v. Clark County Fire Dept',
      type: 'PERSONAL_INJURY', stage: 'NEGOTIATION', priority: 'MEDIUM',
      clientId: clients[4].id, assignedToId: sarah.id,
      incidentDate: subMonths(now, 14), statute: addDays(now, 365),
      estimatedValue: 145000, stageEnteredAt: subDays(now, 28),
    },
    {
      caseNumber: 'PPL-2025-10016', title: 'Taylor v. Nevada Power Company',
      type: 'PRODUCT_LIABILITY', stage: 'DEMAND', priority: 'HIGH',
      clientId: clients[5].id, assignedToId: paul.id,
      incidentDate: subMonths(now, 11), statute: addDays(now, 420),
      estimatedValue: 485000, stageEnteredAt: subDays(now, 22),
    },
    {
      caseNumber: 'PPL-2025-10017', title: 'Anderson v. Boyd Gaming',
      type: 'SLIP_AND_FALL', stage: 'SETTLEMENT', priority: 'MEDIUM',
      clientId: clients[6].id, assignedToId: jessica.id,
      incidentDate: subMonths(now, 18), statute: addDays(now, 180),
      estimatedValue: 88000, settlementOffer: 72000,
      stageEnteredAt: subDays(now, 8),
    },
    {
      caseNumber: 'PPL-2025-10018', title: 'Thomas v. Desert Medical Center',
      type: 'MEDICAL_MALPRACTICE', stage: 'LITIGATION', priority: 'CRITICAL',
      clientId: clients[7].id, assignedToId: paul.id,
      incidentDate: subMonths(now, 20), statute: addDays(now, 200),
      estimatedValue: 950000, stageEnteredAt: subDays(now, 75),
    },
  ]

  const createdCases = []
  for (const cData of caseData) {
    const c = await prisma.case.create({
      data: {
        caseNumber: cData.caseNumber,
        title: cData.title,
        type: cData.type as never,
        status: (cData.dateClosed ? 'SETTLED' : 'ACTIVE') as never,
        stage: cData.stage as never,
        priority: cData.priority as never,
        clientId: cData.clientId,
        assignedToId: cData.assignedToId,
        incidentDate: cData.incidentDate,
        statute: cData.statute,
        estimatedValue: cData.estimatedValue,
        settlementOffer: (cData as { settlementOffer?: number }).settlementOffer,
        settlementFinal: (cData as { settlementFinal?: number }).settlementFinal,
        dateClosed: (cData as { dateClosed?: Date }).dateClosed,
        stageEnteredAt: cData.stageEnteredAt,
        description: `Plaintiff personal injury case. ${cData.type.replace('_', ' ')} involving ${cData.title.split(' v. ')[1] ?? 'defendant'}.`,
      },
    })
    createdCases.push(c)
  }

  console.log('✅ Cases created')

  // ─── Tasks ───────────────────────────────────────────────────
  const taskTemplates = [
    { title: 'Order police report', category: 'FILING', priority: 'HIGH', daysOffset: 2 },
    { title: 'Request medical records', category: 'MEDICAL', priority: 'HIGH', daysOffset: 3 },
    { title: 'Send retainer agreement', category: 'CLIENT_CONTACT', priority: 'CRITICAL', daysOffset: 1 },
    { title: 'File demand letter', category: 'FILING', priority: 'HIGH', daysOffset: 5 },
    { title: 'Schedule client update call', category: 'CLIENT_CONTACT', priority: 'MEDIUM', daysOffset: 7 },
    { title: 'Review insurance policy', category: 'INTERNAL', priority: 'MEDIUM', daysOffset: 4 },
    { title: 'Obtain expert opinion', category: 'DISCOVERY', priority: 'HIGH', daysOffset: 14 },
    { title: 'Prepare settlement demand package', category: 'NEGOTIATION', priority: 'HIGH', daysOffset: 10 },
  ]

  for (const c of createdCases.slice(0, 12)) {
    const templates = taskTemplates.slice(0, Math.floor(Math.random() * 5) + 3)
    for (const t of templates) {
      const dueDate = addDays(now, t.daysOffset - (Math.random() > 0.3 ? 0 : 8)) // some overdue
      await prisma.task.create({
        data: {
          caseId: c.id,
          title: t.title,
          category: t.category as never,
          priority: t.priority as never,
          status: Math.random() > 0.7 ? 'COMPLETED' : (dueDate < now ? 'OVERDUE' : 'PENDING') as never,
          dueDate,
          assignedToId: c.assignedToId,
          completedAt: Math.random() > 0.7 ? subDays(now, Math.floor(Math.random() * 10)) : undefined,
        },
      })
    }
  }

  console.log('✅ Tasks created')

  // ─── Notes ───────────────────────────────────────────────────
  for (const c of createdCases.slice(0, 10)) {
    await prisma.note.createMany({
      data: [
        { caseId: c.id, authorId: c.assignedToId, content: `Initial case intake completed. Client reports ${c.type.toLowerCase().replace('_', ' ')} occurred. Documentation being gathered.`, createdAt: subDays(now, 20) },
        { caseId: c.id, authorId: c.assignedToId, content: `Spoke with client today. Medical treatment ongoing at Desert Springs. Bills accumulating, estimated $15,000 so far.`, createdAt: subDays(now, 10) },
      ],
    })
  }

  console.log('✅ Notes created')

  // ─── Time Entries ────────────────────────────────────────────
  const attorneys = [paul, sarah, mike]
  for (const c of createdCases.slice(0, 15)) {
    const atty = attorneys.find(a => a.id === c.assignedToId) ?? paul
    for (let i = 0; i < 3; i++) {
      await prisma.timeEntry.create({
        data: {
          caseId: c.id,
          userId: atty.id,
          description: ['Client conference', 'Document review', 'Research and drafting', 'Correspondence with insurance'][i % 4],
          hours: [1.5, 2.0, 0.5, 3.0, 1.0][i % 5],
          rate: atty.role === 'ADMIN' ? 450 : 350,
          date: subDays(now, i * 5 + 1),
          billable: true,
        },
      })
    }
  }

  console.log('✅ Time entries created')

  // ─── Documents ───────────────────────────────────────────────
  const docCategories = ['POLICE_REPORT', 'MEDICAL_RECORDS', 'MEDICAL_BILLS', 'PHOTOS', 'INSURANCE_POLICY', 'RETAINER', 'CORRESPONDENCE']
  for (const c of createdCases.slice(0, 10)) {
    const numDocs = Math.floor(Math.random() * 4) + 1
    for (let i = 0; i < numDocs; i++) {
      const cat = docCategories[i % docCategories.length]
      await prisma.document.create({
        data: {
          caseId: c.id,
          name: `${cat.toLowerCase().replace('_', '-')}-${c.caseNumber}.pdf`,
          category: cat as never,
          url: `https://blob.vercel-storage.com/placeholder/${c.caseNumber}/${cat}.pdf`,
          size: Math.floor(Math.random() * 2000000) + 100000,
          mimeType: 'application/pdf',
          uploadedBy: 'System Seed',
        },
      })
    }
  }

  console.log('✅ Documents created')

  // ─── Audit Run + Flags ───────────────────────────────────────
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@paddalaw.ai' },
    update: {},
    create: { name: 'System', email: 'system@paddalaw.ai', role: 'ADMIN' },
  })

  const auditRun = await prisma.auditRun.create({
    data: {
      triggeredBy: paul.id,
      type: 'MANUAL',
      casesScanned: 18,
      flagsFound: 12,
      riskScore: 42.5,
      completedAt: subDays(now, 1),
    },
  })

  const flagData = [
    { caseId: createdCases[0].id, type: 'SOL_WARNING', severity: 'CRITICAL', urgency: 'IMMEDIATE', title: 'SOL expires in 4 days', description: 'Statute of limitations for Johnson v. Clark County Transit expires in 4 days. No demand letter filed.', recommendation: 'File demand or complaint immediately. Contact Paul for emergency review.' },
    { caseId: createdCases[1].id, type: 'SOL_WARNING', severity: 'HIGH', urgency: 'THIS_WEEK', title: 'SOL expires in 12 days', description: 'Vasquez case has SOL expiring in 12 days. Demand package not yet complete.', recommendation: 'Finalize and send demand letter this week. Confirm all medical specials documented.' },
    { caseId: createdCases[10].id, type: 'STALLED', severity: 'HIGH', urgency: 'THIS_WEEK', title: 'Case stalled 95 days in Investigation', description: 'Thompson v. Republic Services has been in Investigation stage for 95 days, exceeding the 30-day threshold.', recommendation: 'Schedule attorney review. Determine why investigation is stalled and create action plan.' },
    { caseId: createdCases[11].id, type: 'STALLED', severity: 'HIGH', urgency: 'THIS_WEEK', title: 'Case stalled 110 days in Negotiation', description: 'Lee v. CCSD School Bus has been in Negotiation for 110 days with SOL approaching in 60 days.', recommendation: 'Escalate negotiation. Consider filing if settlement not reached within 2 weeks.' },
    { caseId: createdCases[6].id, type: 'MISSING_DOC', severity: 'MEDIUM', urgency: 'THIS_WEEK', title: 'No expert report filed', description: 'Davis v. Sunrise Hospital (Medical Malpractice) has no Expert Report in file. Required for this case type.', recommendation: 'Identify and retain medical expert. Request records for expert review.' },
    { caseId: createdCases[4].id, type: 'UNDERVALUED', severity: 'MEDIUM', urgency: 'THIS_MONTH', title: 'Wrongful death case may be undervalued', description: 'Morrison v. MGM Resorts estimated at $1.2M but comparable wrongful death settlements average $2-4M in Clark County.', recommendation: 'Review valuation with Paul. Consider economic expert for damages calculation.' },
    { caseId: createdCases[9].id, type: 'MISSING_DOC', severity: 'MEDIUM', urgency: 'THIS_WEEK', title: 'No medical records on file', description: 'Martinez v. Construction Zone Negligence (3 weeks old) has no medical records uploaded.', recommendation: 'Send records request immediately to all treating providers.' },
    { caseId: createdCases[3].id, type: 'OVERDUE_TASK', severity: 'HIGH', urgency: 'IMMEDIATE', title: '3 overdue tasks', description: 'Williams v. Southwest Airlines has 3 overdue tasks including expert retention.', recommendation: 'Review and complete overdue tasks. Reassign if necessary.' },
  ]

  for (const flag of flagData) {
    await prisma.auditFlag.create({
      data: {
        ...flag,
        runId: auditRun.id,
        type: flag.type as never,
        severity: flag.severity as never,
        urgency: flag.urgency as never,
      },
    })
  }

  console.log('✅ Audit run + flags created')

  // ─── Competitors ─────────────────────────────────────────────
  const competitors = [
    {
      name: 'Adam Kutner', firm: 'Adam S. Kutner & Associates',
      website: 'https://www.adamkutner.com', phone: '7025539999',
      practiceAreas: ['Auto Accident', 'Slip and Fall', 'Wrongful Death'],
      adPlatforms: ['TV', 'Radio', 'Billboards', 'Google Ads'],
      estimatedCases: 800, avgSettlement: 85000, winRate: 94,
      reviewCount: 2400, avgRating: 4.8, reclaimScore: 72,
      reclaimAnalysis: 'Heavy TV advertising presence. Strong brand recognition but volume-focused, lower individual case attention. Opportunity: position PPL as boutique high-value alternative.',
      tags: ['high-volume', 'TV-advertiser', 'brand-leader'],
    },
    {
      name: 'Richard Harris', firm: 'Richard Harris Personal Injury Law Firm',
      website: 'https://www.richardharrislaw.com', phone: '7025448444',
      practiceAreas: ['Auto Accident', 'Personal Injury', 'Workers Comp'],
      adPlatforms: ['TV', 'Billboards', 'Social Media'],
      estimatedCases: 600, avgSettlement: 92000, winRate: 91,
      reviewCount: 1800, avgRating: 4.7, reclaimScore: 65,
      reclaimAnalysis: 'Established brand, strong Spanish-language outreach. Weakness: slow case resolution (avg 18 months). PPL can win on speed and communication.',
      tags: ['established', 'spanish-market', 'slow-resolution'],
    },
    {
      name: 'James Bertoldo', firm: 'Bertoldo, Baker, Carter & Smith',
      practiceAreas: ['Auto Accident', 'Medical Malpractice', 'Wrongful Death'],
      adPlatforms: ['Google Ads', 'Legal Directories'],
      estimatedCases: 200, avgSettlement: 145000, winRate: 88,
      reviewCount: 320, avgRating: 4.5, reclaimScore: 58,
      reclaimAnalysis: 'Boutique firm focusing on high-value med-mal cases. Similar positioning to PPL for complex cases. Monitor for case type overlap.',
      tags: ['boutique', 'high-value', 'med-mal'],
    },
    {
      name: 'Marc Stein', firm: 'Stein & Markus',
      practiceAreas: ['Slip and Fall', 'Premises Liability'],
      adPlatforms: ['SEO', 'Legal Directories', 'Referrals'],
      estimatedCases: 120, avgSettlement: 78000, winRate: 85,
      reviewCount: 180, avgRating: 4.3, reclaimScore: 42,
      reclaimAnalysis: 'Referral-based practice, limited digital presence. Low threat but watch for casino/hotel premises cases. Opportunity to capture their overflow.',
      tags: ['referral-based', 'premises', 'limited-digital'],
    },
    {
      name: 'Glen Lerner', firm: 'Glen Lerner Injury Attorneys',
      website: 'https://www.glenlerner.com', phone: '7023336222',
      practiceAreas: ['Auto Accident', 'Personal Injury', 'Truck Accidents'],
      adPlatforms: ['TV', 'Radio', 'Billboards', 'Google Ads', 'Social Media'],
      estimatedCases: 1200, avgSettlement: 75000, winRate: 89,
      reviewCount: 3200, avgRating: 4.6, reclaimScore: 78,
      reclaimAnalysis: 'Largest volume competitor. Multi-state operation, very high advertising spend. Weakness: client complaints about attorney accessibility. PPL can win on personal service and higher individual attention.',
      tags: ['high-volume', 'multi-state', 'highest-ad-spend'],
    },
  ]

  for (const comp of competitors) {
    await prisma.competitor.create({ data: { ...comp } })
  }

  console.log('✅ Competitors created')

  // ─── Stage History ────────────────────────────────────────────
  const activeCreated = createdCases.filter(c => c.status === 'ACTIVE').slice(0, 8)
  for (const c of activeCreated) {
    await prisma.stageHistory.create({
      data: { caseId: c.id, fromStage: 'INTAKE', toStage: c.stage as never, movedAt: subDays(now, 30), movedBy: c.assignedToId },
    })
  }

  // ─── Integration Sync Records ─────────────────────────────────
  const integrations = ['quickbooks', 'google-calendar', 'docusign']
  for (const sys of integrations) {
    await prisma.integrationSync.create({
      data: { system: sys, status: 'success', message: 'Sync completed successfully', records: Math.floor(Math.random() * 20) + 5, syncedAt: subDays(now, 1) },
    })
  }

  // ─── Communication Logs ───────────────────────────────────────
  await prisma.communicationLog.createMany({
    data: [
      { type: 'MORNING_BRIEFING', recipient: 'paul@paddalaw.com', subject: 'Morning Briefing — Friday, April 4, 2026', status: 'sent', sentAt: subDays(now, 1), metadata: { activeCases: 18, solWarnings: 2, todayTasks: 12 } },
      { type: 'NIGHTLY_REPORT', recipient: 'paul@paddalaw.com', subject: 'Nightly Report — Thursday, April 3, 2026', status: 'sent', sentAt: subDays(now, 2), metadata: { completedTasks: 4, dailyRevenue: 5250 } },
      { type: 'SOL_ALERT', recipient: 'paul@paddalaw.com,sarah@paddalaw.com', subject: '⚠️ SOL Alert: 2 critical cases', status: 'sent', sentAt: subDays(now, 1), metadata: { criticalCases: 2 } },
    ],
  })

  console.log('✅ Integration syncs + communication logs created')
  console.log('\n🎉 Seed complete! Login with paul@paddalaw.com / PaddaLaw2026!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
