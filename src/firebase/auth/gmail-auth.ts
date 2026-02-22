'use client';

import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  type UserCredential 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

/**
 * Initiates the Gmail OAuth flow via Firebase.
 * Requests scopes for sending, reading, and modifying messages.
 */
export async function connectGmailAccount(userId: string): Promise<void> {
  const provider = new GoogleAuthProvider();
  
  // Required scopes for CRM functionality
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
  provider.addScope('https://www.googleapis.com/auth/gmail.modify');
  
  // Ensure we get a refresh token if possible
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline',
  });

  const result: UserCredential = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential) {
    throw new Error('Failed to get Google credentials');
  }

  const tokenData = {
    accessToken: credential.accessToken,
    // Note: idToken is used for Firebase Auth, accessToken for Google APIs
    connectedEmail: result.user.email,
    updatedAt: serverTimestamp(),
    // Firebase popup usually doesn't return refresh_token directly in client.
    // In a production app, use a redirect flow to secure the refresh_token.
  };

  const configRef = doc(db, 'users', userId, 'integrations', 'gmail');
  await setDoc(configRef, tokenData, { merge: true });
}
