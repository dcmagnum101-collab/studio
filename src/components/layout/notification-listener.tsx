'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';

/**
 * NotificationListener - Logic removed to prevent unauthorized collectionGroup queries on sms_thread.
 * Security rules now restrict collectionGroup access to path-segment validation.
 */
export function NotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // Broad collectionGroup query on 'sms_thread' removed to avoid permission errors.
    // Real-time notifications should be handled via scoped contact listeners.
    if (!user || !firestore) return;
  }, [user, firestore]);

  return null;
}
