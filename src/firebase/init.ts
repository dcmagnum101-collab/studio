'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Module-level instances to ensure true singleton behavior across the client
let firebaseAppInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

/**
 * Initializes and returns Firebase service instances.
 * Ensures services are only initialized once and uses real SDK only.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  if (!firebaseAppInstance) {
    if (getApps().length === 0) {
      firebaseAppInstance = initializeApp(firebaseConfig);
    } else {
      firebaseAppInstance = getApp();
    }
  }

  if (!authInstance) {
    authInstance = getAuth(firebaseAppInstance);
  }

  if (!firestoreInstance) {
    firestoreInstance = getFirestore(firebaseAppInstance);
  }

  return {
    firebaseApp: firebaseAppInstance,
    auth: authInstance,
    firestore: firestoreInstance
  };
}
