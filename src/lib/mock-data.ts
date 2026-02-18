
export type ArchAgentSource = "fsbo" | "expired" | "frbo" | "preforeclosure" | "circle_prospect" | "recommended" | "manual" | "probate" | "open_house" | "social_capture" | "gis_import";
export type ArchAgentTag = "absentee_owner" | "high_equity" | "free_and_clear" | "empty_nester" | "mover_upper" | "out_of_state_owner" | "estate_sale" | "probate_lead" | "almost_lead" | "ghost_lead";
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
  propertyAddress: string;
  motivation: string;
  icpScore: number;
  archagent_source: ArchAgentSource;
  archagent_tags: ArchAgentTag[];
  pipeline_stage: PipelineStage;
  ai_urgency: 'hot' | 'warm' | 'cold' | 'nurture';
  ai_sentiment: 'positive' | 'neutral' | 'negative';
  ai_summary: string;
  ai_next_best_action: string;
  estimated_commission: number;
  likely_to_list_score?: number;
  property_type: PropertyType;
  activityLogs: ActivityLog[];
  created_at: string;
  status: string;
  dnc?: boolean;
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
    archagent_source: 'expired',
    archagent_tags: ['high_equity', 'mover_upper'],
    pipeline_stage: 'appointment_set',
    ai_urgency: 'hot',
    ai_sentiment: 'positive',
    ai_summary: 'Sarah is highly motivated by her relocation. She is interested in a fast cash offer but would consider listing if it can be done within 3 weeks.',
    ai_next_best_action: 'Prepare net proceeds sheet for Friday presentation.',
    estimated_commission: 14500,
    property_type: 'single_family',
    likely_to_list_score: 85,
    activityLogs: [
      { id: 'a1', type: 'call', date: '2024-03-21T14:30:00Z', outcome: 'Answered', summary: 'Spoke with seller. Interested in a cash offer. Moving in 3 weeks.', sentiment: 'positive', nextAction: 'Send written offer' },
      { id: 'a2', type: 'ai_note', date: '2024-03-22T09:00:00Z', outcome: 'AI Analysis', summary: 'Detected high urgency signal. Recommend 24h follow-up.' }
    ],
    created_at: '2024-03-20T10:00:00Z',
    status: 'Urgent'
  },
  {
    id: '4',
    name: 'Estate of Henry Miller',
    email: 'miller.estate@example.com',
    phone: '+1 (555) 000-1111',
    propertyAddress: '555 Oak Lane, Las Vegas, NV',
    motivation: 'Inherited property, family needs to settle estate.',
    icpScore: 84,
    archagent_source: 'probate',
    archagent_tags: ['estate_sale', 'probate_lead'],
    pipeline_stage: 'new_lead',
    ai_urgency: 'warm',
    ai_sentiment: 'neutral',
    ai_summary: 'Probate case filed last week. Property is free and clear.',
    ai_next_best_action: 'Send handwritten empathy card to the executor.',
    estimated_commission: 18000,
    property_type: 'single_family',
    activityLogs: [],
    created_at: '2024-03-24T08:00:00Z',
    status: 'Lead'
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
];
