import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { FOLLOW_UP_CADENCES, getNextFollowUpDate, type LeadStatus } from '@/lib/lead-types';

export const dynamic = 'force-dynamic';

/**
 * Automation endpoint to process daily follow-up cadences.
 * Protected by Authorization header.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[Cadence Engine] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    console.log(`[Cadence Engine] Starting run for user: ${userId}`);
    const today = new Date();
    const todayISO = today.toISOString();
    
    const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');
    const tasksRef = adminDb.collection('users').doc(userId).collection('tasks');

    // Query active contacts
    const snapshot = await contactsRef
      .where('pipeline_stage', 'not-in', ['closed', 'dead', 'dnc'])
      .get();

    // Filter locally for due dates or unset dates
    const dueContacts = snapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.nextFollowUpDate || data.nextFollowUpDate <= todayISO;
    });

    let tasksCreated = 0;

    for (const contactDoc of dueContacts) {
      const contact = contactDoc.data();
      const status = (contact.status || 'new') as LeadStatus;
      const cadence = FOLLOW_UP_CADENCES[status];
      
      // If no cadence defined for this status, skip
      if (!cadence) continue;

      const nextStageIndex = (contact.followUpStage || 0) + 1;
      const stageConfig = cadence.stages.find(s => s.stage === nextStageIndex);

      if (!stageConfig) {
        console.log(`[Cadence Engine] ${contact.name} reached end of ${status} cadence. Moving to nurture.`);
        await contactDoc.ref.update({
          pipeline_stage: 'long_term_nurture',
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create a quarterly nurture check-in
        const threeMonths = new Date();
        threeMonths.setMonth(threeMonths.getMonth() + 3);
        await tasksRef.add({
          contactId: contactDoc.id,
          contact_name: contact.name,
          title: "Quarterly Nurture Check-in",
          description: "End of initial intensive cadence. Maintain relationship.",
          priority: 'low',
          status: 'pending',
          due_date: threeMonths.toISOString(),
          type: 'call',
          ownerId: userId,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        continue;
      }

      // Create Task for the agent
      const priority = (contact.icpScore || 0) >= 80 ? 'urgent' : (contact.icpScore || 0) >= 60 ? 'high' : 'normal';
      
      await tasksRef.add({
        contactId: contactDoc.id,
        contact_name: contact.name,
        title: `Follow up: ${contact.name} — Step ${nextStageIndex}`,
        description: stageConfig.notes,
        ai_reason: `Auto-cadence: ${cadence.name} Step ${nextStageIndex}`,
        priority,
        status: 'pending',
        due_date: todayISO,
        type: stageConfig.method,
        ownerId: userId,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Advance contact stage and set next scan date
      const nextDate = getNextFollowUpDate(status, nextStageIndex, todayISO);
      await contactDoc.ref.update({
        followUpStage: nextStageIndex,
        nextFollowUpDate: nextDate.toISOString(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      tasksCreated++;
    }

    console.log(`[Cadence Engine] Completed. Created ${tasksCreated} tasks for ${dueContacts.length} contacts.`);
    return NextResponse.json({ 
      tasksCreated, 
      contactsProcessed: dueContacts.length 
    });

  } catch (error: any) {
    console.error('[Cadence Engine] Critical failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
