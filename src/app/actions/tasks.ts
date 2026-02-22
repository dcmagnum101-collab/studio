
'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { getNextFollowUpDate, type LeadStatus } from '@/lib/lead-types';

/**
 * Marks a task as completed and updates lead follow-up state.
 */
export async function completeTaskAction(userId: string, taskId: string) {
  const taskRef = adminDb.collection('users').doc(userId).collection('tasks').doc(taskId);
  const taskDoc = await taskRef.get();
  
  if (!taskDoc.exists) throw new Error('Task not found');
  const task = taskDoc.data()!;

  // 1. Mark task as completed
  await taskRef.update({ 
    status: 'completed', 
    completed_at: admin.firestore.FieldValue.serverTimestamp() 
  });

  // 2. Refresh lead follow-up date based on current completion time
  if (task.contactId) {
    const contactRef = adminDb.collection('users').doc(userId).collection('contacts').doc(task.contactId);
    const contactDoc = await contactRef.get();
    
    if (contactDoc.exists) {
      const contact = contactDoc.data()!;
      const currentStage = contact.followUpStage || 0;
      const status = (contact.status || 'new') as LeadStatus;
      
      // Re-calculate next follow-up from NOW since the task is actually finished
      const nextDate = getNextFollowUpDate(status, currentStage, new Date().toISOString());
      
      await contactRef.update({
        lastContactDate: admin.firestore.FieldValue.serverTimestamp(),
        nextFollowUpDate: nextDate.toISOString(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  return { success: true };
}

/**
 * Snoozes a task by moving the due date forward.
 */
export async function snoozeTaskAction(userId: string, taskId: string, days: number) {
  const snoozeDate = new Date();
  snoozeDate.setDate(snoozeDate.getDate() + days);
  
  await adminDb.collection('users').doc(userId).collection('tasks').doc(taskId).update({
    due_date: snoozeDate.toISOString(),
    status: 'pending',
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
}

/**
 * Archives (deletes) a task.
 */
export async function archiveTaskAction(userId: string, taskId: string) {
  await adminDb.collection('users').doc(userId).collection('tasks').doc(taskId).delete();
  return { success: true };
}
