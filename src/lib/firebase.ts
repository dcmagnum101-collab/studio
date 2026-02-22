'use client';

import { initializeFirebase } from '@/firebase/init';

/**
 * Legacy bridge to ensure components importing from @/lib/firebase
 * use the same singleton instances as the rest of the app.
 * 
 * Prevents multiple app initializations which cause token invalidation.
 */
const { firestore, auth: firebaseAuth, firebaseApp, functions: firebaseFunctions } = initializeFirebase();

export const db = firestore;
export const auth = firebaseAuth;
export const functions = firebaseFunctions;
export default firebaseApp;
