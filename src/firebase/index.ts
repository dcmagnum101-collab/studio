'use client';

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

// Firestore Hooks - Real SDK implementations
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useMemoFirebase } from './utils';
