
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { FOLLOW_UP_CADENCES, type LeadStatus } from '@/lib/lead-types';
import { generateNurtureEmail } from '@/app/actions/nurture-ai';
import { sendNurtureEmail } from '@/app/actions/gmail';

/**
 * Automation endpoint to process daily follow-ups.
 */
export async function POST(request: NextRequest) {
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const today = new Date().toISOString();
  const contactsRef = adminDb.collection('users').doc(userId).collection('contacts');
  
  const dueContacts = await contactsRef
    .where('nextFollowUpDate', '<=', today)
    .where('pipeline_stage', 'not-in', ['closed', 'dnc'])
    .limit(20)
    .get();

  let tasksCreated = 0;
  let emailsSent = 0;

  for (const doc of dueContacts.docs) {
    const contact = doc.data();
    const status = (contact.status || 'new') as LeadStatus;
    const cadence = FOLLOW_UP_CADENCES[status];
    const stage = (contact.followUpStage || 0) + 1;
    const stageConfig = cadence?.stages.find(s => s.stage === stage);

    if (!stageConfig) continue;

    // 1. Create Task
    await adminDb.collection('users').doc(userId).collection('tasks').add({
      contactId: doc.id,
      contact_name: contact.name,
      title: `${cadence.name}: Step ${stage}`,
      description: stageConfig.notes,
      priority: 'normal',
      status: 'pending',
      due_date: today,
      type: stageConfig.method,
      ownerId: userId,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    tasksCreated++;

    // 2. Auto-Email (if configured)
    if (stageConfig.method === 'email' && contact.email) {
      try {
        const aiDraft = await generateNurtureEmail(userId, doc.id);
        await sendNurtureEmail({
          userId,
          contactId: doc.id,
          to: contact.email,
          subject: aiDraft.subject,
          body: aiDraft.body
        });
        emailsSent++;
      } catch (err) {
        console.error(`Failed auto-nurture for ${doc.id}:`, err);
      }
    }
  }

  return NextResponse.json({ 
    processed: dueContacts.size, 
    tasksCreated, 
    emailsSent 
  });
}
