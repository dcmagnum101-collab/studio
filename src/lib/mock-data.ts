
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
  propertyAddress: string;
  motivation: string;
  icpScore: number;
  source: 'ArchAgent' | 'Vulcan7' | 'Manual' | 'CSV';
  lastContacted: string | null;
  dnc: boolean;
  status: 'Lead' | 'Contacted' | 'Meeting Set' | 'Closed';
  activityLogs: ActivityLog[];
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
    lastContacted: '2024-03-21',
    dnc: false,
    status: 'Contacted',
    activityLogs: [
      {
        id: 'a1',
        type: 'call',
        date: '2024-03-21T14:30:00Z',
        outcome: 'Spoke with seller',
        summary: 'Interested in a cash offer. Moving in 3 weeks.',
        nextAction: 'Send written offer'
      },
      {
        id: 'a2',
        type: 'status_change',
        date: '2024-03-21T14:35:00Z',
        outcome: 'Updated status',
        summary: 'Status changed from Lead to Contacted'
      }
    ]
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    phone: '+1 (555) 987-6543',
    propertyAddress: '789 Oak Ave, Austin, TX',
    motivation: 'Inherited property, lives abroad.',
    icpScore: 88,
    source: 'Vulcan7',
    lastContacted: '2024-03-15',
    dnc: false,
    status: 'Contacted',
    activityLogs: [
      {
        id: 'a3',
        type: 'email',
        date: '2024-03-15T10:00:00Z',
        outcome: 'Sent',
        summary: 'Introductory email regarding property inheritance.'
      }
    ]
  },
  {
    id: '3',
    name: 'Robert Miller',
    email: 'miller.robert@example.com',
    phone: '+1 (555) 456-7890',
    propertyAddress: '456 Pine Ln, Round Rock, TX',
    motivation: 'Retiring and downsizing.',
    icpScore: 75,
    source: 'Manual',
    lastContacted: null,
    dnc: false,
    status: 'Lead',
    activityLogs: []
  },
  {
    id: '4',
    name: 'Jessica Williams',
    email: 'jess.w@example.com',
    phone: '+1 (555) 222-3333',
    propertyAddress: '321 Elm St, Cedar Park, TX',
    motivation: 'Financial difficulties, urgent sale.',
    icpScore: 95,
    source: 'ArchAgent',
    lastContacted: '2024-03-20',
    dnc: true,
    status: 'Lead',
    activityLogs: []
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    phone: '+1 (555) 888-9999',
    propertyAddress: '555 Cedar Ct, Austin, TX',
    motivation: 'Upgrading to a larger home.',
    icpScore: 62,
    source: 'CSV',
    lastContacted: null,
    dnc: false,
    status: 'Lead',
    activityLogs: []
  },
];

export const LEAD_SOURCES_STATS = [
  { name: 'ArchAgent', count: 145, avgScore: 84, lastSync: '2 hours ago' },
  { name: 'Vulcan7', count: 89, avgScore: 72, lastSync: '5 hours ago' },
  { name: 'Manual Entry', count: 12, avgScore: 65, lastSync: '10 mins ago' },
  { name: 'CSV Import', count: 230, avgScore: 45, lastSync: '2 days ago' },
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
