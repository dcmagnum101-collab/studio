
import * as admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK.
 * Uses the service account JSON from environment variables.
 */
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Admin SDK] Initialized with Service Account');
    } else {
      // Fallback for environments where ADC or default initialization is configured
      admin.initializeApp();
      console.log('[Admin SDK] Initialized with Default Credentials');
    }
  } catch (error) {
    console.error('[Admin SDK] Initialization failed:', error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
