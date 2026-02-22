
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export async function GET(request: NextRequest) {
  console.log('[Gmail Auth] Callback initiated');
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    console.error('[Gmail Auth] No code provided in callback');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=no_code`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('[Gmail Auth] Token exchange successful');
    
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_success=true`);
    
    // Set a temporary cookie to store tokens until the client can claim them
    // This is a bridge for the client-side Firebase session
    response.cookies.set('temp_gmail_tokens', JSON.stringify(tokens), { 
      maxAge: 60 * 5, // 5 minutes
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error('[Gmail Auth] Token exchange failed:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=token_failure`);
  }
}
