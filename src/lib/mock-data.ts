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
  contactId: string;
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
  contactId: string;
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
  likely_to_lead_score?: number;
  likely_to_contact_score?: number;
  loan_to_value?: number;
  sequence_step: number;
  property_type: PropertyType;
  activityLogs: ActivityLog[];
  created_at: string;
  status: string;
  dnc?: boolean;
  auction_date?: string;
  days_since_expired?: number;
  days_on_market?: number;
}

// REAL DATA MODE: Hardcoded mock data arrays removed to ensure data comes from Firestore.
export const MOCK_CONTACTS: Contact[] = [];
export const MOCK_TASKS: Task[] = [];
export const MOCK_APPOINTMENTS: Appointment[] = [];

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
