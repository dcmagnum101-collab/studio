
export type ArchAgentSource = "fsbo" | "expired" | "frbo" | "preforeclosure" | "circle_prospect" | "recommended" | "manual";
export type ArchAgentTag = "absentee_owner" | "high_equity" | "free_and_clear" | "empty_nester" | "mover_upper" | "out_of_state_owner";
export type PropertyType = "single_family" | "condo" | "multi_family" | "townhouse" | "other";

export interface ActivityLog {
  id: string;
  type: 'call' | 'email' | 'sms' | 'status_change';
  date: string;
  outcome: string;
  summary: string;
  nextAction?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  phone2?: string;
  propertyAddress: string;
  city?: string;
  state?: string;
  zip?: string;
  motivation: string;
  icpScore: number;
  source: string;
  archagent_source: ArchAgentSource;
  archagent_tags: ArchAgentTag[];
  likely_to_list_score?: number;
  likely_to_lead_score?: number;
  likely_to_contact_score?: number;
  days_on_market?: number;
  days_since_expired?: number;
  preforeclosure_status?: string;
  auction_date?: string;
  property_sqft?: number;
  property_beds?: number;
  property_baths?: number;
  property_type: PropertyType;
  loan_to_value?: number;
  outreach_sequence?: string;
  sequence_step: number;
  sequence_next_date?: string;
  lastContacted: string | null;
  dnc: boolean;
  status: 'Lead' | 'Contacted' | 'Meeting Set' | 'Closed' | 'Urgent' | 'DNC';
  activityLogs: ActivityLog[];
  created_at: string;
}

export const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 123-4567',
    propertyAddress: '123 Maple Dr, Austin, TX',
    motivation: 'Moving out of state for a new job, needs quick sale.',
    icpScore: 92,
    source: 'ArchAgent',
    archagent_source: 'expired',
    archagent_tags: ['high_equity', 'mover_upper'],
    property_type: 'single_family',
    likely_to_list_score: 85,
    days_since_expired: 2,
    loan_to_value: 45,
    sequence_step: 0,
    status: 'Contacted',
    lastContacted: '2024-03-21',
    dnc: false,
    activityLogs: [
      { id: 'a1', type: 'call', date: '2024-03-21T14:30:00Z', outcome: 'Spoke with seller', summary: 'Interested in a cash offer. Moving in 3 weeks.', nextAction: 'Send written offer' }
    ],
    created_at: '2024-03-20T10:00:00Z'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    phone: '+1 (555) 987-6543',
    propertyAddress: '789 Oak Ave, Austin, TX',
    motivation: 'Inherited property, lives abroad.',
    icpScore: 88,
    source: 'ArchAgent',
    archagent_source: 'preforeclosure',
    archagent_tags: ['absentee_owner', 'free_and_clear'],
    property_type: 'condo',
    preforeclosure_status: 'notice_of_sale',
    auction_date: '2024-04-15T10:00:00Z',
    loan_to_value: 10,
    sequence_step: 1,
    status: 'Urgent',
    lastContacted: '2024-03-15',
    dnc: false,
    activityLogs: [],
    created_at: '2024-03-15T09:00:00Z'
  },
  {
    id: '3',
    name: 'Jessica Williams',
    email: 'jess.w@example.com',
    phone: '+1 (555) 222-3333',
    propertyAddress: '321 Elm St, Cedar Park, TX',
    motivation: 'Financial difficulties, urgent sale.',
    icpScore: 95,
    source: 'ArchAgent',
    archagent_source: 'fsbo',
    archagent_tags: ['high_equity'],
    property_type: 'single_family',
    days_on_market: 42,
    sequence_step: 0,
    status: 'Lead',
    lastContacted: null,
    dnc: false,
    activityLogs: [],
    created_at: '2024-03-22T11:00:00Z'
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    phone: '+1 (555) 888-9999',
    propertyAddress: '555 Cedar Ct, Austin, TX',
    motivation: 'Upgrading to a larger home.',
    icpScore: 62,
    source: 'ArchAgent',
    archagent_source: 'circle_prospect',
    archagent_tags: ['empty_nester'],
    property_type: 'townhouse',
    sequence_step: 0,
    status: 'Lead',
    lastContacted: null,
    dnc: false,
    activityLogs: [],
    created_at: '2024-03-22T08:00:00Z'
  }
];

export const KPI_STATS = [
  { label: 'Total Leads', value: '476', change: '+12%', icon: 'Users' },
  { label: 'Average ICP Score', value: '74', change: '+5%', icon: 'Target' },
  { label: 'Calls Made', value: '1,284', change: '+18%', icon: 'Phone' },
  { label: 'Conversion Rate', value: '3.2%', change: '+0.4%', icon: 'TrendingUp' },
];

export const MONTHLY_TRENDS = [
  { month: 'Jan', revenue: 4500, leads: 120 },
  { month: 'Feb', revenue: 5200, leads: 140 },
  { month: 'Mar', revenue: 6100, leads: 165 },
  { month: 'Apr', revenue: 5800, leads: 150 },
  { month: 'May', revenue: 7200, leads: 190 },
  { month: 'Jun', revenue: 8400, leads: 210 },
];
