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
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  contactId?: string;
}

/**
 * Sends a single email using Gmail and logs it to Firestore.
 * Handles unsubscribe checks and daily quota limits.
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  // Check unsubscribe status if contactId is provided
  if (options.contactId) {
    try {
      const contact = await db
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

  // Check daily quota (max 500/day for standard Gmail)
  const today = new Date().toISOString().split('T')[0];
  const quotaRef = db.collection('email_quota').doc(today);
  
  try {
    const quota = await quotaRef.get();
    const currentCount = quota.data()?.count || 0;
    const dailyLimit = 500;

    if (currentCount >= dailyLimit) {
      // Queue for tomorrow if limit reached
      await db.collection('email_queue').add({
        ...options,
        queued_at: admin.FieldValue.serverTimestamp(),
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

    // Increment daily quota count
    await quotaRef.set(
      { count: admin.FieldValue.increment(1), date: today, last_sent: admin.FieldValue.serverTimestamp() },
      { merge: true }
    );

    // Log the successful send
    await db.collection('outreach_log').add({
      type: 'email',
      to: options.to,
      subject: options.subject,
      contact_id: options.contactId || null,
      status: 'delivered',
      message_id: result.messageId,
      sent_at: admin.FieldValue.serverTimestamp(),
    });

    return { success: true, messageId: result.messageId };

  } catch (error: any) {
    console.error('Email send failure:', error);
    
    // Log the failure
    await db.collection('outreach_log').add({
      type: 'email',
      to: options.to,
      subject: options.subject,
      contact_id: options.contactId || null,
      status: 'failed',
      error: error.message,
      sent_at: admin.FieldValue.serverTimestamp(),
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
