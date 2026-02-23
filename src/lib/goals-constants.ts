/**
 * @fileOverview Strategic goals configuration and types.
 */

export interface Goals {
  callsPerDay: number;
  contactsPerWeek: number;
  appointmentsPerWeek: number;
  emailsPerDay: number;
}

export const DEFAULT_GOALS: Goals = {
  callsPerDay: 20,
  contactsPerWeek: 10,
  appointmentsPerWeek: 3,
  emailsPerDay: 15,
};
