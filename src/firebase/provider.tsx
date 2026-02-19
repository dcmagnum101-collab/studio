'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
}: FirebaseProviderProps) {
  const [userState, setUserState] = useState<{ user: User | null; loading: boolean; error: Error | null }>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          signInAnonymously(auth);
        }
        setUserState({ user, loading: false, error: null });
      },
      (error) => {
        setUserState({ user: null, loading: false, error });
      }
    );
    return () => unsubscribe();
  }, [auth]);

  const value = useMemo(() => ({
    areServicesAvailable: !!(firebaseApp && firestore && auth),
    firebaseApp,
    firestore,
    auth,
    user: userState.user,
    isUserLoading: userState.loading,
    userError: userState.error,
  }), [firebaseApp, firestore, auth, userState]);

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = () => {
  const { auth } = useFirebase();
  if (!auth) throw new Error('Auth service not available');
  return auth;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error('Firestore service not available');
  return firestore;
};

export const useFirebaseApp = () => {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) throw new Error('Firebase app not available');
  return firebaseApp;
};

export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
