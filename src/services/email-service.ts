
'use server';

import * as nodemailer from 'nodemailer';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface EmailOptions {
  userId: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  contactId?: string;
}

/**
 * Sends a single email using Gmail and logs it to Firestore.
 * Scoped to users/{userId}/outreach_log and users/{userId}/email_quota.
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  const userDocRef = db.collection('users').doc(options.userId);

  // Check unsubscribe status if contactId is provided - Scoped to User
  if (options.contactId) {
    try {
      const contact = await userDocRef
        .collection('contacts')
        .doc(options.contactId)
        .get();
      
      if (contact.exists && contact.data()?.email_unsubscribed === true) {
        console.log(`Skipping send to ${options.to} - contact is unsubscribed.`);
        return { success: false, error: 'unsubscribed' };
      }
    } catch (e) {
      console.error('Error checking unsubscribe status:', e);
    }
  }

  // Check daily quota (max 500/day for standard Gmail) - Scoped to User
  const today = new Date().toISOString().split('T')[0];
  const quotaRef = userDocRef.collection('email_quota').doc(today);
  
  try {
    const quota = await quotaRef.get();
    const currentCount = quota.data()?.count || 0;
    const dailyLimit = 500;

    if (currentCount >= dailyLimit) {
      // Queue for tomorrow if limit reached - Scoped to User
      await userDocRef.collection('email_queue').add({
        ...options,
        queued_at: admin.firestore.FieldValue.serverTimestamp(),
        status: 'queued',
      });
      console.log(`Email to ${options.to} queued - daily limit reached (${currentCount}/${dailyLimit}).`);
      return { success: false, error: 'limit_reached' };
    }

    // Send the email
    const result = await transporter.sendMail({
      from: `"Monica Selvaggio" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || process.env.GMAIL_USER,
    });

    // Increment daily quota count - Scoped to User
    await quotaRef.set(
      { count: admin.firestore.FieldValue.increment(1), date: today, last_sent: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    // Log the successful send - Scoped to User
    await userDocRef.collection('outreach_log').add({
      type: 'email',
      to: options.to,
      subject: options.subject,
      contact_id: options.contactId || null,
      status: 'delivered',
      message_id: result.messageId,
      sent_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, messageId: result.messageId };

  } catch (error: any) {
    console.error('Email send failure:', error);
    
    // Log the failure - Scoped to User
    await userDocRef.collection('outreach_log').add({
      type: 'email',
      to: options.to,
      subject: options.subject,
      contact_id: options.contactId || null,
      status: 'failed',
      error: error.message,
      sent_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: false, error: error.message };
  }
}

/**
 * Sends bulk emails with a small delay to avoid Gmail anti-spam flags.
 */
export async function sendBulkEmail(
  recipients: EmailOptions[]
): Promise<{ sent: number; failed: number; queued: number }> {

  let sent = 0;
  let failed = 0;
  let queued = 0;

  for (const recipient of recipients) {
    try {
      const result = await sendEmail(recipient);
      if (result.success) {
        sent++;
      } else if (result.error === 'limit_reached') {
        queued++;
      } else if (result.error !== 'unsubscribed') {
        failed++;
      }
    } catch (error) {
      failed++;
    }
    // 250ms artificial delay between sends
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  return { sent, failed, queued };
}
