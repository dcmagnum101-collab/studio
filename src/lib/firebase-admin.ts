import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initializes the Firebase Admin SDK for server-side use.
 */
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}'
);

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: 'studio-7266015203-e5837'
      });
      console.log('[Admin SDK] Initialized with Service Account');
    } else {
      // Fallback for environments with ADC (Application Default Credentials)
      initializeApp({
        projectId: 'studio-7266015203-e5837'
      });
      console.log('[Admin SDK] Initialized with Default Credentials');
    }
  } catch (error) {
    console.error('[Admin SDK] Initialization failed:', error);
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
