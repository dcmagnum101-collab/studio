
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  // Note: In a real app, you'd get the current user ID from a session cookie
  // For this prototype, we assume the user is authenticated via Firebase on the client
  // and we might pass a state parameter. Here we'll redirect back to settings
  // and handle the final sync on the client or via a temporary state.
  
  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // We need the userId. In a real Next.js app with Firebase, 
    // we'd use a secure session cookie or state param.
    // For now, redirect to a processing page that captures the userId from the client.
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_success=true`);
    
    // Set a temporary cookie to store tokens until the client can claim them
    response.cookies.set('temp_gmail_tokens', JSON.stringify(tokens), { 
      maxAge: 60 * 5, // 5 minutes
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error('Gmail Auth Error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=true`);
  }
}
