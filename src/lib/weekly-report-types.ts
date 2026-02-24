/**
 * @fileOverview Weekly report type definitions.
 * Separated from actions file to comply with Next.js 15 'use server' restrictions.
 */
export interface WeeklyReport {
  headline: string;
  stats: {
    calls: number;
    emails: number;
    new_leads: number;
    appointments: number;
    warm_moves: number;
    dead_leads: number;
  };
  what_worked: string[];
  what_to_improve: string[];
  next_week_focus: string;
  lead_type_breakdown: Record<string, number>;
}
