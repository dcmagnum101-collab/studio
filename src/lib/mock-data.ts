
export type ArchAgentSource = "fsbo" | "expired" | "frbo" | "preforeclosure" | "circle_prospect" | "recommended" | "manual";
export type ArchAgentTag = "absentee_owner" | "high_equity" | "free_and_clear" | "empty_nester" | "mover_upper" | "out_of_state_owner";
export type PropertyType = "single_family" | "condo" | "multi_family" | "townhouse" | "other";
export type PipelineStage = "new_lead" | "attempted_contact" | "conversation_had" | "follow_up_scheduled" | "appointment_set" | "appointment_completed" | "listing_agreement_sent" | "listed" | "under_contract" | "closed" | "not_interested" | "dnc" | "long_term_nurture";
export type TaskPriority = "urgent" | "high" | "normal" | "low";
export type TaskStatus = "pending" | "completed" | "snoozed";

export interface ActivityLog {
  id: string;
  type: 'call' | 'email' | 'sms' | 'status_change' | 'ai_note';
  date: string;
  outcome: string;
  summary: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  nextAction?: string;
}

export interface Task {
  id: string;
  contact_id: string;
  contact_name: string;
  type: 'call' | 'email' | 'sms' | 'appointment' | 'follow_up' | 'custom';
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  ai_reason?: string;
}

export interface Appointment {
  id: string;
  contact_id: string;
  contact_name: string;
  title: string;
  date: string;
  duration_minutes: number;
  type: string;
  status: string;
  address?: string;
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
  pipeline_stage: PipelineStage;
  ai_urgency: 'hot' | 'warm' | 'cold' | 'nurture';
  ai_sentiment: 'positive' | 'neutral' | 'negative';
  ai_summary: string;
  ai_next_best_action: string;
  total_calls: number;
  total_conversations: number;
  estimated_commission: number;
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
    pipeline_stage: 'appointment_set',
    ai_urgency: 'hot',
    ai_sentiment: 'positive',
    ai_summary: 'Sarah is highly motivated by her relocation. She is interested in a fast cash offer but would consider listing if it can be done within 3 weeks.',
    ai_next_best_action: 'Prepare net proceeds sheet for Friday presentation.',
    total_calls: 3,
    total_conversations: 1,
    estimated_commission: 14500,
    property_type: 'single_family',
    likely_to_list_score: 85,
    days_since_expired: 2,
    loan_to_value: 45,
    sequence_step: 2,
    status: 'Contacted',
    lastContacted: '2024-03-21',
    dnc: false,
    activityLogs: [
      { id: 'a1', type: 'call', date: '2024-03-21T14:30:00Z', outcome: 'Answered', summary: 'Spoke with seller. Interested in a cash offer. Moving in 3 weeks.', sentiment: 'positive', nextAction: 'Send written offer' },
      { id: 'a2', type: 'ai_note', date: '2024-03-22T09:00:00Z', outcome: 'AI Analysis', summary: 'Detected high urgency signal. Recommend 24h follow-up.' }
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
    pipeline_stage: 'attempted_contact',
    ai_urgency: 'warm',
    ai_sentiment: 'neutral',
    ai_summary: 'Inherited property. No response to initial voicemail. High equity makes this a prime target for cash buyers.',
    ai_next_best_action: 'Send SMS follow-up regarding auction date.',
    total_calls: 1,
    total_conversations: 0,
    estimated_commission: 12000,
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
    pipeline_stage: 'new_lead',
    ai_urgency: 'hot',
    ai_sentiment: 'neutral',
    ai_summary: 'FSBO for 42 days. Likely frustrated with DIY process. Financial pressure is increasing.',
    ai_next_best_action: 'Initial call to offer free valuation.',
    total_calls: 0,
    total_conversations: 0,
    estimated_commission: 18000,
    property_type: 'single_family',
    days_on_market: 42,
    sequence_step: 0,
    status: 'Lead',
    lastContacted: null,
    dnc: false,
    activityLogs: [],
    created_at: '2024-03-22T11:00:00Z'
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    contact_id: '1',
    contact_name: 'Sarah Johnson',
    type: 'call',
    title: 'Callback: Discussion about divorce timeline',
    description: 'Sarah requested a callback to discuss how the divorce impacts the closing date.',
    priority: 'urgent',
    status: 'pending',
    due_date: '2024-03-23T10:00:00Z',
    ai_reason: 'High urgency detected from previous call sentiment.'
  },
  {
    id: 't2',
    contact_id: '2',
    contact_name: 'Michael Chen',
    type: 'sms',
    title: 'Follow up on notice of sale',
    description: 'Send SMS checking if they received the latest auction notice.',
    priority: 'high',
    status: 'pending',
    due_date: '2024-03-23T14:00:00Z'
  },
  {
    id: 't3',
    contact_id: '1',
    contact_name: 'Sarah Johnson',
    type: 'email',
    title: 'Send Net Proceeds Worksheet',
    description: 'Prepare and send the estimate of what she will net after the sale.',
    priority: 'normal',
    status: 'pending',
    due_date: '2024-03-23T16:00:00Z'
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'ap1',
    contact_id: '1',
    contact_name: 'Sarah Johnson',
    title: 'Listing Presentation',
    date: '2024-03-25T14:00:00Z',
    duration_minutes: 60,
    type: 'In-person',
    status: 'Scheduled',
    address: '123 Maple Dr, Austin, TX'
  }
];

export const KPI_STATS = [
  { label: 'Active Pipeline', value: '$1.48M', change: '+12%', icon: 'Target' },
  { label: 'Connect Rate', value: '24%', change: '+5%', icon: 'Phone' },
  { label: 'Tasks Due', value: '8', change: 'Today', icon: 'CheckCircle' },
  { label: 'Commission (YTD)', value: '$46.2k', change: '+18%', icon: 'TrendingUp' },
];

export const MONTHLY_TRENDS = [
  { month: 'Jan', revenue: 4500, leads: 120 },
  { month: 'Feb', revenue: 5200, leads: 140 },
  { month: 'Mar', revenue: 6100, leads: 165 },
  { month: 'Apr', revenue: 5800, leads: 150 },
  { month: 'May', revenue: 7200, leads: 190 },
  { month: 'Jun', revenue: 8400, leads: 210 },
];
