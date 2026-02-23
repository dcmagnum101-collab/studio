'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { firebaseConfig } from './config';

// Module-level instances to ensure true singleton behavior across the client
let firebaseAppInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;
let functionsInstance: Functions | undefined;

/**
 * Initializes and returns Firebase service instances.
 * Removed App Check and reCAPTCHA logic to prevent throttling errors.
 */
export function initializeFirebase(): { 
  firebaseApp: FirebaseApp; 
  auth: Auth; 
  firestore: Firestore;
  functions: Functions;
} {
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

  if (!functionsInstance) {
    functionsInstance = getFunctions(firebaseAppInstance);
  }

  return {
    firebaseApp: firebaseAppInstance,
    auth: authInstance,
    firestore: firestoreInstance,
    functions: functionsInstance
  };
}
