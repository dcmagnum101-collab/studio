/**
 * @fileOverview Core lead types, statuses, and follow-up cadence logic
 * for the Monica AI Hub real estate platform.
 */

// ─── Lead Status Types ───────────────────────────────────────────────────────

export type LeadStatus =
  | 'expired'
  | 'fsbo'
  | 'pre-foreclosure'
  | 'frbo'
  | 'divorce'
  | 'rec'
  | 'circle'
  | 'open-house'
  | 'past-client'
  | 'sphere'
  | 'new'
  | 'active'
  | 'nurture'
  | 'closed'
  | 'dead';

export type LeadPriority = 'hot' | 'warm' | 'cold';

export type ContactMethod = 'call' | 'sms' | 'email' | 'door-knock' | 'social';

export type LeadSource =
  | 'trulia'
  | 'realtor'
  | 'zillow'
  | 'fsbo-listing'
  | 'clark-county'
  | 'expired-mls'
  | 'circle-prospecting'
  | 'open-house'
  | 'referral'
  | 'social-media'
  | 'divorce-filing'
  | 'manual'
  | 'other';

// ─── Lead Interface ──────────────────────────────────────────────────────────

export interface Lead {
  id?: string;
  // Identity
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  phone2?: string;

  // Address
  address: string;
  city: string;
  state: string;
  zip: string;
  county?: string;

  // Property
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: number;
  yearBuilt?: number;
  listPrice?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  estimatedValue?: number;
  equity?: number;
  mlsNumber?: string;
  daysOnMarket?: number;
  listingExpiredDate?: string;
  foreclosureFilingDate?: string;
  auctionDate?: string;
  loanBalance?: number;
  liens?: number;

  // Lead Management
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource;
  assignedTo?: string;
  tags?: string[];
  notes?: string;

  // Follow-up
  lastContactDate?: string;
  nextFollowUpDate?: string;
  nextFollowUpMethod?: ContactMethod;
  followUpCount?: number;
  followUpStage?: number;
  touchCount?: number;

  // AI
  aiScore?: number; // 0-100
  aiNotes?: string;
  aiNextAction?: string;
  motivationLevel?: 'high' | 'medium' | 'low';
  timelineToSell?: 'immediate' | '1-3months' | '3-6months' | '6-12months' | '12+months';

  // Timestamps
  createdAt?: string;
  updatedAt?: string;

  // Coordinates for map
  lat?: number;
  lng?: number;

  // Raw source data
  rawData?: Record<string, unknown>;
}

// ─── Follow-Up Cadence Definitions ──────────────────────────────────────────

export interface FollowUpStage {
  stage: number;
  daysAfterPrevious: number;
  method: ContactMethod;
  messageTemplate: string;
  notes: string;
}

export interface FollowUpCadence {
  status: LeadStatus;
  name: string;
  description: string;
  stages: FollowUpStage[];
}

// ─── Optimized Follow-Up Patterns Per Lead Type ─────────────────────────────

export const FOLLOW_UP_CADENCES: Record<LeadStatus, FollowUpCadence> = {
  expired: {
    status: 'expired',
    name: 'Expired Listing Cadence',
    description: 'High-urgency follow-up for recently expired listings. Strike while the iron is hot.',
    stages: [
      { stage: 1, daysAfterPrevious: 0, method: 'call', messageTemplate: 'expired_day1_call', notes: 'Call same day listing expires. Introduce yourself, acknowledge the frustration, offer a fresh perspective.' },
      { stage: 2, daysAfterPrevious: 1, method: 'sms', messageTemplate: 'expired_day2_sms', notes: 'Follow-up SMS with market stats for their area.' },
      { stage: 3, daysAfterPrevious: 1, method: 'email', messageTemplate: 'expired_day3_email', notes: 'Send comparative market analysis email.' },
      { stage: 4, daysAfterPrevious: 2, method: 'call', messageTemplate: 'expired_day5_call', notes: 'Second call. Ask if they have spoken to their previous agent.' },
      { stage: 5, daysAfterPrevious: 3, method: 'door-knock', messageTemplate: 'expired_week1_door', notes: 'Personal door knock with printed CMA.' },
      { stage: 6, daysAfterPrevious: 7, method: 'call', messageTemplate: 'expired_week2_call', notes: 'Check in call. Have they relisted?' },
      { stage: 7, daysAfterPrevious: 7, method: 'sms', messageTemplate: 'expired_week3_sms', notes: 'Share a recent success story in their neighborhood.' },
      { stage: 8, daysAfterPrevious: 14, method: 'email', messageTemplate: 'expired_month2_email', notes: 'Monthly market update email.' },
      { stage: 9, daysAfterPrevious: 30, method: 'call', messageTemplate: 'expired_month3_call', notes: 'Long-term nurture call. Market may have shifted.' },
      { stage: 10, daysAfterPrevious: 60, method: 'email', messageTemplate: 'expired_longterm_email', notes: 'Quarterly market update newsletter.' },
    ],
  },

  fsbo: {
    status: 'fsbo',
    name: 'For Sale By Owner Cadence',
    description: 'Respect their independence while demonstrating your value. Education-first approach.',
    stages: [
      { stage: 1, daysAfterPrevious: 0, method: 'call', messageTemplate: 'fsbo_day1_call', notes: 'Introduce yourself. Do NOT pitch - offer free resources and ask about their timeline.' },
      { stage: 2, daysAfterPrevious: 3, method: 'door-knock', messageTemplate: 'fsbo_day3_door', notes: 'Stop by with a printed "For Sale By Owner" guide you created. Be genuinely helpful.' },
      { stage: 3, daysAfterPrevious: 4, method: 'email', messageTemplate: 'fsbo_week1_email', notes: 'Send email with recent comparable sales in their neighborhood.' },
      { stage: 4, daysAfterPrevious: 7, method: 'call', messageTemplate: 'fsbo_week2_call', notes: 'Check in. How is the showings going? Any offers?' },
      { stage: 5, daysAfterPrevious: 7, method: 'sms', messageTemplate: 'fsbo_week3_sms', notes: 'Text with a buyer inquiry (if real) or market stat.' },
      { stage: 6, daysAfterPrevious: 14, method: 'call', messageTemplate: 'fsbo_month1_call', notes: 'Pivot call: "Most FSBOs list with an agent within 4 weeks. How are you doing?"' },
      { stage: 7, daysAfterPrevious: 14, method: 'email', messageTemplate: 'fsbo_month1_email', notes: 'Send case study of FSBO who saved time and got more money with an agent.' },
      { stage: 8, daysAfterPrevious: 30, method: 'call', messageTemplate: 'fsbo_month2_call', notes: 'Final push call. Make a direct offer to help.' },
      { stage: 9, daysAfterPrevious: 30, method: 'email', messageTemplate: 'fsbo_longterm_email', notes: 'Quarterly market update. Keep relationship warm.' },
    ],
  },

  'pre-foreclosure': {
    status: 'pre-foreclosure',
    name: 'Pre-Foreclosure / NOD Cadence',
    description: 'Sensitive, empathetic outreach. These homeowners are in distress. Lead with solutions.',
    stages: [
      { stage: 1, daysAfterPrevious: 0, method: 'email', messageTemplate: 'preforeclosure_day1_email', notes: 'Non-threatening email. Introduce yourself as a resource. Mention you help homeowners in difficult situations.' },
      { stage: 2, daysAfterPrevious: 3, method: 'call', messageTemplate: 'preforeclosure_day3_call', notes: 'Gentle phone call. Ask how they are doing. DO NOT mention foreclosure directly unless they do.' },
      { stage: 3, daysAfterPrevious: 4, method: 'sms', messageTemplate: 'preforeclosure_week1_sms', notes: 'SMS with a link to a helpful resource (foreclosure prevention guide).' },
      { stage: 4, daysAfterPrevious: 7, method: 'door-knock', messageTemplate: 'preforeclosure_week2_door', notes: 'In-person visit. Bring a short sale / options guide. Be compassionate.' },
      { stage: 5, daysAfterPrevious: 7, method: 'call', messageTemplate: 'preforeclosure_week3_call', notes: 'Check-in call. Have they spoken to their lender? Offer to connect them with resources.' },
      { stage: 6, daysAfterPrevious: 14, method: 'email', messageTemplate: 'preforeclosure_month1_email', notes: 'Email with equity analysis - help them see they may have options.' },
      { stage: 7, daysAfterPrevious: 14, method: 'call', messageTemplate: 'preforeclosure_month1_call', notes: 'Urgency call if auction date is approaching.' },
    ],
  },

  divorce: {
    status: 'divorce',
    name: 'Divorce / Life Transition Cadence',
    description: 'Legally motivated sellers. Sensitive, solution-focused, always both-party neutral.',
    stages: [
      { stage: 1, daysAfterPrevious: 0, method: 'email', messageTemplate: 'divorce_day1_email', notes: 'Neutral introduction. Do NOT reference the divorce. Offer a free home valuation as a resource for their planning.' },
      { stage: 2, daysAfterPrevious: 3, method: 'call', messageTemplate: 'divorce_day3_call', notes: 'Gentle call. Frame as helping them understand their options. Ask if they have a timeline in mind.' },
      { stage: 3, daysAfterPrevious: 5, method: 'email', messageTemplate: 'divorce_day5_email', notes: 'Send equity analysis. Help them see what proceeds from a sale would look like.' },
      { stage: 4, daysAfterPrevious: 7, method: 'call', messageTemplate: 'divorce_week1_call', notes: 'Check in. Have they decided to sell? Offer to work with both parties professionally.' },
      { stage: 5, daysAfterPrevious: 14, method: 'email', messageTemplate: 'divorce_month1_email', notes: 'Market update. Time is often a factor in divorce settlements.' },
      { stage: 6, daysAfterPrevious: 14, method: 'call', messageTemplate: 'divorce_month1_call', notes: 'Final push. Court timelines often force a decision. Be the solution.' },
    ]
  },

  frbo: {
    status: 'frbo',
    name: 'For Rent By Owner Cadence',
    description: 'Landlord-to-seller conversion. Many accidental landlords want to cash out.',
    stages: [
      { stage: 1, daysAfterPrevious: 0, method: 'call', messageTemplate: 'frbo_day1_call', notes: 'Call about the rental listing. Ask about the property - how long have they owned it?' },
      { stage: 2, daysAfterPrevious: 3, method: 'email', messageTemplate: 'frbo_day3_email', notes: 'Email with investment property analysis - cap rate, cash flow, and what they could net from a sale.' },
      { stage: 3, daysAfterPrevious: 7, method: 'call', messageTemplate: 'frbo_week2_call', notes: 'Follow-up call. Did they rent it out? If not, have they considered selling?' },
      { stage: 4, daysAfterPrevious: 14, method: 'sms', messageTemplate: 'frbo_week4_sms', notes: 'SMS with a recent investor purchase in their area.' },
      { stage: 5, daysAfterPrevious: 30, method: 'call', messageTemplate: 'frbo_month2_call', notes: 'Long-term nurture. Market update for investment properties.' },
      { stage: 6, daysAfterPrevious: 60, method: 'email', messageTemplate: 'frbo_month4_email', notes: 'Quarterly investment market update email.' },
    ],
  },

  rec: {
    status: 'rec',
    name: 'REO/Bank-Owned Property Cadence',
    description: 'Bank asset managers and REO contacts. Professional, persistent, data-driven.',
    stages: [
      { stage: 1, daysAfterPrevious: 0, method: 'email', messageTemplate: 'rec_day1_email', notes: 'Professional introduction email to asset manager. Include your REO/bank credentials.' },
      { stage: 2, daysAfterPrevious: 3, method: 'call', messageTemplate: 'rec_day3_call', notes: 'Follow-up call to confirm receipt of email.' },
      { stage: 3, daysAfterPrevious: 7, method: 'email', messageTemplate: 'rec_week2_email', notes: 'Send market area analysis and recent list-to-sale performance.' },
      { stage: 4, daysAfterPrevious: 14, method: 'call', messageTemplate: 'rec_month1_call', notes: 'Monthly check-in with asset manager.' },
      { stage: 5, daysAfterPrevious: 30, method: 'email', messageTemplate: 'rec_month2_email', notes: 'Monthly market performance report.' },
    ],
  },

  circle: {
    status: 'circle',
    name: 'Circle Prospecting Cadence',
    description: 'Neighbors of recent sales or listings. Build awareness and create urgency.',
    stages: [
      { stage: 1, daysAfterPrevious: 0, method: 'door-knock', messageTemplate: 'circle_day1_door', notes: 'Door knock within 24 hours of listing/sale. Share the news and gauge interest.' },
      { stage: 2, daysAfterPrevious: 1, method: 'call', messageTemplate: 'circle_day2_call', notes: 'Follow-up call to those who were interested or not home.' },
      { stage: 3, daysAfterPrevious: 7, method: 'sms', messageTemplate: 'circle_week2_sms', notes: 'SMS with the final sale price of the nearby home (if available).' },
      { stage: 4, daysAfterPrevious: 30, method: 'email', messageTemplate: 'circle_month2_email', notes: 'Monthly neighborhood market update.' },
    ],
  },

  'open-house': {
    status: 'open-house',
    name: 'Open House Lead Cadence',
    description: 'Fresh leads from open houses. Strike while interest is high.',
    stages: [
      { stage: 1, daysAfterPrevious: 0, method: 'sms', messageTemplate: 'oh_sameday_sms', notes: 'Same-day SMS. "Great meeting you at [address] today!"' },
      { stage: 2, daysAfterPrevious: 1, method: 'call', messageTemplate: 'oh_day2_call', notes: 'Next-day call. Follow up on their interest level.' },
      { stage: 3, daysAfterPrevious: 2, method: 'email', messageTemplate: 'oh_day3_email', notes: 'Email with similar listings that match their criteria.' },
      { stage: 4, daysAfterPrevious: 7, method: 'call', messageTemplate: 'oh_week2_call', notes: 'Weekly check-in. Are they still looking?' },
      { stage: 5, daysAfterPrevious: 14, method: 'email', messageTemplate: 'oh_week4_email', notes: 'Market update with new listings.' },
      { stage: 6, daysAfterPrevious: 30, method: 'call', messageTemplate: 'oh_month2_call', notes: 'Monthly nurture call.' },
    ],
  },

  'past-client': {
    status: 'past-client',
    name: 'Past Client Nurture',
    description: 'Your warmest leads. Keep in touch for referrals and repeat business.',
    stages: [
      { stage: 1, daysAfterPrevious: 30, method: 'call', messageTemplate: 'pastclient_month1_call', notes: '30-day check-in after closing. How are they loving the new home?' },
      { stage: 2, daysAfterPrevious: 60, method: 'email', messageTemplate: 'pastclient_month3_email', notes: 'Market update for their neighborhood.' },
      { stage: 3, daysAfterPrevious: 90, method: 'call', messageTemplate: 'pastclient_month6_call', notes: '6-month anniversary call.' },
      { stage: 4, daysAfterPrevious: 180, method: 'email', messageTemplate: 'pastclient_year1_email', notes: '1-year anniversary email with home value update.' },
      { stage: 5, daysAfterPrevious: 180, method: 'call', messageTemplate: 'pastclient_year1_call', notes: 'Annual check-in call. Any neighbors looking to buy/sell?' },
    ],
  },

  sphere: {
    status: 'sphere',
    name: 'Sphere of Influence',
    description: 'Friends, family, and acquaintances. Gentle, relationship-first touches.',
    stages: [
      { stage: 1, daysAfterPrevious: 30, method: 'call', messageTemplate: 'sphere_monthly_call', notes: 'Monthly personal check-in. Not a sales call.' },
      { stage: 2, daysAfterPrevious: 30, method: 'email', messageTemplate: 'sphere_monthly_email', notes: 'Monthly market newsletter.' },
      { stage: 3, daysAfterPrevious: 90, method: 'social', messageTemplate: 'sphere_quarterly_social', notes: 'Engage with their social media posts.' },
    ],
  },

  new: { status: 'new', name: 'New Lead - Unqualified', description: 'Just entered the system.', stages: [] },
  active: { status: 'active', name: 'Active Working Lead', description: 'Currently in conversation.', stages: [] },
  nurture: { status: 'nurture', name: 'Long-Term Nurture', description: 'Not ready now but keep warm.', stages: [] },
  closed: { status: 'closed', name: 'Closed Deal', description: 'Successfully closed.', stages: [] },
  dead: { status: 'dead', name: 'Dead Lead', description: 'Not interested, unresponsive.', stages: [] },
};

// ─── Follow-Up Calculation Helpers ───────────────────────────────────────────

export function getNextFollowUpDate(
  leadStatus: LeadStatus,
  currentStage: number,
  lastContactDate?: string
): Date {
  const cadence = FOLLOW_UP_CADENCES[leadStatus];
  const nextStage = cadence?.stages.find(s => s.stage === currentStage + 1);
  
  const base = lastContactDate ? new Date(lastContactDate) : new Date();
  if (!nextStage) {
    // Default: follow up in 30 days if no cadence stage
    return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  
  return new Date(base.getTime() + nextStage.daysAfterPrevious * 24 * 60 * 60 * 1000);
}

export function getNextFollowUpMethod(
  leadStatus: LeadStatus,
  currentStage: number
): ContactMethod {
  const cadence = FOLLOW_UP_CADENCES[leadStatus];
  const nextStage = cadence?.stages.find(s => s.stage === currentStage + 1);
  return nextStage?.method || 'call';
}

export function getFollowUpStageNotes(leadStatus: LeadStatus, stage: number): string {
  const cadence = FOLLOW_UP_CADENCES[leadStatus];
  const stageData = cadence?.stages.find(s => s.stage === stage);
  return stageData?.notes || '';
}

export function calculateLeadPriority(lead: Partial<Lead>): LeadPriority {
  // Hot: expired < 7 days, FSBO actively listed, pre-foreclosure with upcoming auction
  if (lead.status === 'expired') {
    const expiredDate = lead.listingExpiredDate ? new Date(lead.listingExpiredDate) : null;
    if (expiredDate) {
      const daysSinceExpiry = (Date.now() - expiredDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceExpiry < 7) return 'hot';
      if (daysSinceExpiry < 30) return 'warm';
    }
    return 'cold';
  }
  
  if (lead.status === 'pre-foreclosure') {
    if (lead.auctionDate) {
      const daysToAuction = (new Date(lead.auctionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysToAuction < 30) return 'hot';
      if (daysToAuction < 90) return 'warm';
    }
    return 'warm';
  }
  
  if (lead.status === 'fsbo') {
    const daysSinceCreated = lead.createdAt 
      ? (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    if (daysSinceCreated < 3) return 'hot';
    if (daysSinceCreated < 14) return 'warm';
    return 'cold';
  }
  
  if (lead.aiScore !== undefined) {
    if (lead.aiScore >= 75) return 'hot';
    if (lead.aiScore >= 40) return 'warm';
  }
  
  return 'cold';
}

export function getLeadStatusLabel(status: LeadStatus): string {
  const labels: Record<LeadStatus, string> = {
    expired: 'Expired',
    fsbo: 'FSBO',
    'pre-foreclosure': 'Pre-Foreclosure',
    frbo: 'FRBO',
    divorce: 'Divorce',
    rec: 'REC/REO',
    circle: 'Circle',
    'open-house': 'Open House',
    'past-client': 'Past Client',
    sphere: 'Sphere',
    new: 'New',
    active: 'Active',
    nurture: 'Nurture',
    closed: 'Closed',
    dead: 'Dead',
  };
  return labels[status] || status;
}

export function getLeadStatusColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    expired: 'bg-red-100 text-red-800',
    fsbo: 'bg-orange-100 text-orange-800',
    'pre-foreclosure': 'bg-purple-100 text-purple-800',
    frbo: 'bg-yellow-100 text-yellow-800',
    divorce: 'bg-rose-100 text-rose-800',
    rec: 'bg-blue-100 text-blue-800',
    circle: 'bg-green-100 text-green-800',
    'open-house': 'bg-teal-100 text-teal-800',
    'past-client': 'bg-indigo-100 text-indigo-800',
    sphere: 'bg-pink-100 text-pink-800',
    new: 'bg-gray-100 text-gray-800',
    active: 'bg-emerald-100 text-emerald-800',
    nurture: 'bg-cyan-100 text-cyan-800',
    closed: 'bg-slate-100 text-slate-800',
    dead: 'bg-gray-100 text-gray-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: LeadPriority): string {
  const colors: Record<LeadPriority, string> = {
    hot: 'text-red-600',
    warm: 'text-orange-500',
    cold: 'text-blue-500',
  };
  return colors[priority];
}

// ─── Lead Score Calculator ────────────────────────────────────────────────────

export function calculateAIScore(lead: Partial<Lead>): number {
  let score = 50; // base

  // Status-based scoring
  const statusScores: Partial<Record<LeadStatus, number>> = {
    expired: 80,
    'pre-foreclosure': 85,
    fsbo: 70,
    frbo: 55,
    divorce: 75,
    circle: 45,
    'open-house': 65,
    'past-client': 90,
    sphere: 60,
  };
  if (lead.status && statusScores[lead.status] !== undefined) {
    score = statusScores[lead.status]!;
  }

  // Pahrump-specific signals
  if (lead.city?.toLowerCase().includes('pahrump') || lead.zip === '89048' || lead.zip === '89060') {
    // Long-term owners in Pahrump are often retirement-motivated
    if (lead.lastSaleDate) {
      const yearsOwned = (Date.now() - new Date(lead.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (yearsOwned > 15) score += 15; // Very long-term Pahrump owner = likely ready
      if (yearsOwned > 10) score += 8;
    }
    // Free & clear properties in Pahrump are high value targets
    if (lead.loanBalance === 0 || lead.equity === lead.estimatedValue) score += 12;
  }

  // Boulder City signals  
  if (lead.city?.toLowerCase().includes('boulder city') || lead.zip === '89005') {
    // Boulder City has limited inventory and strong demand — any motivated seller is valuable
    score += 5; // Base boost for Boulder City
    // Historic district properties are unique — flag for special handling
    if (lead.tags?.includes('historic_district')) {
      score += 5;
      lead.aiNotes = (lead.aiNotes || '') + ' NOTE: Boulder City historic district — verify renovation restrictions before listing conversation.';
    }
  }

  // Equity boost
  if (lead.equity && lead.estimatedValue) {
    const equityPct = lead.equity / lead.estimatedValue;
    if (equityPct > 0.5) score += 10;
    else if (equityPct > 0.3) score += 5;
    else if (equityPct < 0) score -= 20; // underwater
  }

  // Urgency boosts
  if (lead.auctionDate) {
    const days = (new Date(lead.auctionDate).getTime() - Date.now()) / 86400000;
    if (days < 30) score += 15;
  }
  if (lead.listingExpiredDate) {
    const days = (Date.now() - new Date(lead.listingExpiredDate).getTime()) / 86400000;
    if (days < 3) score += 20;
    else if (days < 7) score += 10;
  }

  // Contact info completeness
  if (lead.phone) score += 5;
  if (lead.email) score += 3;

  // Prior contact
  if ((lead.touchCount || 0) > 0 && (lead.touchCount || 0) < 5) score += 5;

  return Math.min(100, Math.max(0, score));
}
