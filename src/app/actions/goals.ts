'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { grokAsk } from '@/services/grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';
import { sendNurtureEmail } from './gmail';
import { Goals, DEFAULT_GOALS } from '@/lib/goals-constants';

/**
 * Saves Monica's daily and weekly activity goals.
 */
export async function saveGoals(userId: string, goals: Goals) {
  if (!userId) throw new Error('Unauthorized');
  await adminDb.collection('users').doc(userId).collection('settings').doc('goals').set({
    ...goals,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Retrieves the current goals for Monica, falling back to defaults if not set.
 */
export async function getGoals(userId: string): Promise<Goals> {
  const doc = await adminDb.collection('users').doc(userId).collection('settings').doc('goals').get();
  if (!doc.exists) return DEFAULT_GOALS;
  return doc.data() as Goals;
}

/**
 * Audits daily performance and sends a coaching recap if goals are missed.
 */
export async function generateDailyRecap(userId: string) {
  const userRef = adminDb.collection('users').doc(userId);
  const goals = await getGoals(userId);
  
  const today = new Date().toISOString().split('T')[0];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayTs = admin.firestore.Timestamp.fromDate(startOfDay);

  // Fetch Stats
  const [callsSnap, emailsSnap, contactsSnap, apptsSnap] = await Promise.all([
    adminDb.collectionGroup('activityLogs').where('ownerId', '==', userId).where('type', '==', 'call').where('date', '>=', today).get(),
    userRef.collection('email_quota').doc(today).get(),
    userRef.collection('contacts').where('created_at', '>=', startOfDayTs).get(),
    userRef.collection('appointments').where('date', '>=', today).get(),
  ]);

  const stats = {
    calls: callsSnap.size,
    emails: emailsSnap.data()?.count || 0,
    contacts: contactsSnap.size,
    appts: apptsSnap.size
  };

  const goalsMet = stats.calls >= goals.callsPerDay && stats.emails >= goals.emailsPerDay;

  if (!goalsMet) {
    // Select top 5 leads for tomorrow
    const leadsSnap = await userRef.collection('contacts')
      .where('pipeline_stage', 'not-in', ['closed', 'dead', 'dnc'])
      .orderBy('icpScore', 'desc')
      .limit(5)
      .get();
    
    const leads = leadsSnap.docs.map(d => ({ name: d.data().name, address: d.data().propertyAddress, score: d.data().icpScore }));

    const system = `${monicaSystemPrompt}\nYou are Monica's high-performance accountability coach. 
    Review her stats and write a brief, motivating, and direct daily recap. 
    Highlight the gap between her goals and results. 
    Format with 2 short paragraphs. Focus on the "Power Hour" tomorrow.`;

    const userPrompt = `
      DATE: ${today}
      GOALS: Calls: ${goals.callsPerDay}, Emails: ${goals.emailsPerDay}
      ACTUAL: Calls: ${stats.calls}, Emails: ${stats.emails}
      TOP LEADS FOR TOMORROW: ${JSON.stringify(leads)}
    `;

    const coachRecap = await grokAsk(system, userPrompt, userId);
    const userDoc = await userRef.get();
    const userEmail = userDoc.data()?.email 
      || process.env.GMAIL_USER 
      || 'monicaselvaggio@gmail.com';

    await sendNurtureEmail({
      userId,
      contactId: 'recap',
      to: userEmail,
      subject: `Daily Recap: Monica's Performance Audit`,
      body: `
        <div style="font-family: sans-serif; max-width: 600px; color: #1e293b;">
          <h1 style="color: #1e3a8a;">Today's Recap</h1>
          <p style="font-size: 16px; line-height: 1.6;">${coachRecap.replace(/\n/g, '<br/>')}</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #1e3a8a;">Priority Leads for Tomorrow</h3>
            <ul style="padding-left: 20px;">
              ${leads.map(l => `<li><strong>${l.name}</strong> - ${l.address} (ICP: ${l.score})</li>`).join('')}
            </ul>
          </div>
          <p style="font-size: 12px; color: #64748b;">This automated audit helps you maintain elite consistency in the Las Vegas market.</p>
        </div>
      `
    });
  }

  return { stats, goalsMet };
}
