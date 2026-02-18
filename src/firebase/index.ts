'use client';

/**
 * Barrel file for Firebase functionality.
 * Exports are structured to avoid circular dependencies during build.
 */

export * from './init';
export { 
  FirebaseProvider, 
  useFirebase, 
  useAuth, 
  useFirestore, 
  useFirebaseApp, 
  useMemoFirebase, 
  useUser 
} from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { 
  setDocumentNonBlocking, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from './non-blocking-updates';
export { 
  initiateAnonymousSignIn, 
  initiateEmailSignUp, 
  initiateEmailSignIn 
} from './non-blocking-login';
export { FirestorePermissionError } from './errors';
export { errorEmitter } from './error-emitter';
