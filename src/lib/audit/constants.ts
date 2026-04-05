// Days before a case is flagged as stalled per stage
export const STAGE_THRESHOLDS: Record<string, number> = {
  INTAKE: 14,
  INVESTIGATION: 30,
  DEMAND: 21,
  NEGOTIATION: 45,
  LITIGATION: 90,
  TRIAL: 60,
  SETTLEMENT: 21,
  CLOSED: 0,
}

// Required document categories per case type
export const REQUIRED_DOCS: Record<string, string[]> = {
  AUTO_ACCIDENT: [
    'POLICE_REPORT',
    'MEDICAL_RECORDS',
    'MEDICAL_BILLS',
    'PHOTOS',
    'INSURANCE_POLICY',
  ],
  SLIP_AND_FALL: [
    'PHOTOS',
    'MEDICAL_RECORDS',
    'MEDICAL_BILLS',
    'INCIDENT_REPORT',
  ],
  WRONGFUL_DEATH: [
    'POLICE_REPORT',
    'MEDICAL_RECORDS',
    'DEATH_CERTIFICATE',
    'INSURANCE_POLICY',
  ],
  WORKERS_COMP: [
    'MEDICAL_RECORDS',
    'MEDICAL_BILLS',
    'WAGE_RECORDS',
    'INCIDENT_REPORT',
  ],
  MEDICAL_MALPRACTICE: [
    'MEDICAL_RECORDS',
    'MEDICAL_BILLS',
    'EXPERT_REPORT',
  ],
  PRODUCT_LIABILITY: [
    'MEDICAL_RECORDS',
    'PHOTOS',
    'EXPERT_REPORT',
  ],
  PREMISES_LIABILITY: [
    'PHOTOS',
    'MEDICAL_RECORDS',
    'INCIDENT_REPORT',
  ],
  PERSONAL_INJURY: [
    'MEDICAL_RECORDS',
    'MEDICAL_BILLS',
    'POLICE_REPORT',
  ],
  OTHER: ['MEDICAL_RECORDS'],
}

// Initial task checklist per case type (created after new case)
export const INITIAL_TASK_TEMPLATES: Record<
  string,
  Array<{ title: string; category: string; daysFromOpen: number; priority: string }>
> = {
  AUTO_ACCIDENT: [
    { title: 'Order police report', category: 'FILING', daysFromOpen: 2, priority: 'HIGH' },
    { title: 'Request medical records from all providers', category: 'MEDICAL', daysFromOpen: 3, priority: 'HIGH' },
    { title: 'Send records request letters', category: 'CORRESPONDENCE', daysFromOpen: 5, priority: 'MEDIUM' },
    { title: 'Photograph all injuries', category: 'INTERNAL', daysFromOpen: 1, priority: 'HIGH' },
    { title: 'Obtain insurance policy declarations', category: 'FILING', daysFromOpen: 7, priority: 'HIGH' },
    { title: 'Send retainer agreement to client', category: 'CLIENT_CONTACT', daysFromOpen: 1, priority: 'CRITICAL' },
    { title: 'Set up litigation hold', category: 'INTERNAL', daysFromOpen: 3, priority: 'MEDIUM' },
  ],
  SLIP_AND_FALL: [
    { title: 'Obtain incident report from property owner', category: 'FILING', daysFromOpen: 3, priority: 'HIGH' },
    { title: 'Preserve surveillance footage (if available)', category: 'DISCOVERY', daysFromOpen: 1, priority: 'CRITICAL' },
    { title: 'Photograph the scene', category: 'INTERNAL', daysFromOpen: 1, priority: 'HIGH' },
    { title: 'Request medical records', category: 'MEDICAL', daysFromOpen: 3, priority: 'HIGH' },
    { title: 'Send retainer agreement', category: 'CLIENT_CONTACT', daysFromOpen: 1, priority: 'CRITICAL' },
    { title: 'Identify property owner / insurer', category: 'INVESTIGATION', daysFromOpen: 5, priority: 'HIGH' },
  ],
  WRONGFUL_DEATH: [
    { title: 'Obtain death certificate', category: 'FILING', daysFromOpen: 2, priority: 'CRITICAL' },
    { title: 'Request autopsy report', category: 'MEDICAL', daysFromOpen: 3, priority: 'CRITICAL' },
    { title: 'Identify all wrongful death beneficiaries', category: 'INTERNAL', daysFromOpen: 5, priority: 'HIGH' },
    { title: 'File probate/letters of administration if needed', category: 'FILING', daysFromOpen: 14, priority: 'HIGH' },
    { title: 'Send retainer agreement', category: 'CLIENT_CONTACT', daysFromOpen: 1, priority: 'CRITICAL' },
    { title: 'Request insurance policy limits', category: 'NEGOTIATION', daysFromOpen: 7, priority: 'HIGH' },
  ],
  MEDICAL_MALPRACTICE: [
    { title: 'Request all medical records (5-year history)', category: 'MEDICAL', daysFromOpen: 2, priority: 'CRITICAL' },
    { title: 'Identify potential expert witnesses', category: 'DISCOVERY', daysFromOpen: 14, priority: 'HIGH' },
    { title: 'Calendar SOL and expert affidavit deadline', category: 'DEADLINE', daysFromOpen: 1, priority: 'CRITICAL' },
    { title: 'Send retainer agreement', category: 'CLIENT_CONTACT', daysFromOpen: 1, priority: 'CRITICAL' },
    { title: 'File certificate of merit / expert affidavit (NV)', category: 'FILING', daysFromOpen: 30, priority: 'CRITICAL' },
  ],
  DEFAULT: [
    { title: 'Send retainer agreement to client', category: 'CLIENT_CONTACT', daysFromOpen: 1, priority: 'CRITICAL' },
    { title: 'Gather initial evidence and documentation', category: 'INTERNAL', daysFromOpen: 3, priority: 'HIGH' },
    { title: 'Open client file and send welcome letter', category: 'CLIENT_CONTACT', daysFromOpen: 2, priority: 'MEDIUM' },
    { title: 'Request medical records', category: 'MEDICAL', daysFromOpen: 5, priority: 'HIGH' },
  ],
}
