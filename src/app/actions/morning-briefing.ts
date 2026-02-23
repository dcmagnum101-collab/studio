'use server';

import { adminDb } from '@/lib/firebase-admin';
import { grokAsk } from '@/services/grok-service';
import { monicaSystemPrompt } from '@/config/monica-system-prompt';
import * as admin from 'firebase-admin';

/**
 * @fileOverview Morning Briefing Generation Service.
 * Analyzes pipeline state and uses Grok to prepare Monica's daily game plan.
 */

export async function generateMorningBriefing(userId: string, date: string) {
  if (!userId || !date) throw new Error('Missing required parameters');

  const now = new Date();
  
  // Date boundaries for queries
  const endOfDay = `${date}T23:59:59.999Z`;
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoTs = admin.firestore.Timestamp.fromDate(threeDaysAgo);

  const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');
  const tasksRef = adminDb.collection('users').doc(userId).collection('tasks');

  try {
    // 1. Aggregate Stats for Context
    const [dueTodaySnap, hotExpiredSnap, tasksDueSnap] = await Promise.all([
      contactsRef.where('nextFollowUpDate', '<=', endOfDay).limit(100).get(),
      contactsRef.where('archagent_source', '==', 'expired').where('created_at', '>=', threeDaysAgoTs).limit(100).get(),
      tasksRef.where('status', '==', 'pending').where('due_date', '<=', endOfDay).limit(100).get()
    ]);

    // Local filtering for precision (exclude final stages)
    const dueContacts = dueTodaySnap.docs.filter(d => !['closed', 'dead', 'dnc'].includes(d.data().pipeline_stage));

    const stats = {
      due_followups: dueContacts.length,
      hot_expired: hotExpiredSnap.size,
      tasks_due: tasksDueSnap.size
    };

    // 2. Synthesize Intelligence with Grok
    const system = `${monicaSystemPrompt}\n\nYou are Monica's Executive Sales Assistant. 
    Analyze her pipeline stats for today and provide a high-energy, tactical morning briefing.
    Focus on specific actions she should take in her first hour (Power Hour).
    Format with 2-3 short, punchy paragraphs. Use line breaks between paragraphs.`;

    const userPrompt = `
      REPORTING DATE: ${date}
      PIPELINE DATA:
      - Active Follow-ups Due: ${stats.due_followups}
      - Fresh Expired Leads (Last 72h): ${stats.hot_expired}
      - Tasks on Agenda: ${stats.tasks_due}
      
      What's the high-leverage strategy for today?
    `;

    const briefingText = await grokAsk(system, userPrompt, userId);

    // 3. Cache the Result
    const briefingData = {
      date,
      briefing_text: briefingText,
      stats,
      generated_at: admin.firestore.FieldValue.serverTimestamp(),
      expires_at: new Date(now.setHours(23, 59, 59, 999)).toISOString()
    };

    await adminDb.collection('users').doc(userId).collection('morningBriefings').doc(date).set(briefingData);

    return briefingData;
  } catch (error: any) {
    console.error('[Morning Briefing Action] Synthesis failed:', error);
    throw new Error('Monica could not synthesize your briefing. Please check Grok API key.');
  }
}
