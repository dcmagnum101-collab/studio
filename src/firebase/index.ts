'use client';

/**
 * Main entry point for Firebase services.
 * All internal files use relative imports to prevent circular dependency build hangs.
 */

export { initializeFirebase } from './init';
export { 
  FirebaseProvider, 
  useFirebase, 
  useAuth, 
  useFirestore, 
  useFirebaseApp, 
  useUser 
} from './provider';
export { FirebaseClientProvider } from './client-provider';
export { 
  initiateAnonymousSignIn, 
  initiateEmailSignUp, 
  initiateEmailSignIn 
} from './non-blocking-login';

// Firestore Hooks
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useMemoFirebase } from './utils';
