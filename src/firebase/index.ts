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
