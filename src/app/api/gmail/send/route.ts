
import { NextRequest, NextResponse } from 'next/server';
import { getGmailClient, checkUnsubscribe, logMessage } from '@/services/gmail-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, to, subject, body, leadId, threadId } = await request.json();

    if (!userId || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isUnsubscribed = await checkUnsubscribe(userId, to);
    if (isUnsubscribed) {
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

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId
      },
    });

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
    console.error('Gmail Send Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
