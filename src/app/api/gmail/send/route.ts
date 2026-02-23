import { NextRequest, NextResponse } from 'next/server';
import { getGmailClient, checkUnsubscribe, logMessage } from '@/services/gmail-service';

export const dynamic = 'force-dynamic';

/**
 * API Route to send a Gmail message.
 * This is the public endpoint used by the outreach builder.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, to, subject, body, leadId, threadId } = await request.json();

    if (!userId || !to) {
      console.warn('[Gmail Send] Missing required fields for send');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`[Gmail Send] Checking unsubscribe status for ${to}`);
    const isUnsubscribed = await checkUnsubscribe(userId, to);
    if (isUnsubscribed) {
      console.warn(`[Gmail Send] Blocking outreach to unsubscribed recipient: ${to}`);
      return NextResponse.json({ error: 'Recipient unsubscribed' }, { status: 403 });
    }

    const gmail = await getGmailClient(userId);

    // Create RFC 2822 message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      body,
    ];
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log(`[Gmail Send] Attempting transmission via Google API for user ${userId}`);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId
      },
    });

    console.log(`[Gmail Send] Success! Message ID: ${res.data.id}`);

    await logMessage(userId, {
      leadId,
      threadId: res.data.threadId!,
      subject,
      body,
      to,
      status: 'sent'
    });

    return NextResponse.json({ success: true, messageId: res.data.id });
  } catch (error: any) {
    console.error('[Gmail Send] Critical failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
