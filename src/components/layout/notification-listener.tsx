'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collectionGroup, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * Invisible listener for inbound messages to trigger browser notifications.
 * This is a client-side component because it uses React hooks and Browser APIs.
 */
export function NotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!user || !firestore || typeof window === 'undefined') return;

    // Listen for new inbound messages belonging to this user
    // CRITICAL: We must filter by ownerId to satisfy collectionGroup security rules
    const q = query(
      collectionGroup(firestore, 'sms_thread'),
      where('ownerId', '==', user.uid),
      where('direction', '==', 'inbound'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const msg = change.doc.data();
            // Avoid notifying for historic data on first load
            const isRecent = (new Date().getTime() - new Date(msg.timestamp).getTime()) < 10000;
            
            if (isRecent && Notification.permission === 'granted') {
              new Notification(`New Text from ${msg.from}`, {
                body: msg.body,
                icon: '/favicon.ico'
              });
            }
          }
        });
      },
      async (serverError) => {
        // Handle listener failure with contextual error info
        const permissionError = new FirestorePermissionError({
          path: 'sms_thread (collectionGroup)',
          operation: 'list',
        } satisfies SecurityRuleContext);

        // Emit the error to be caught by the global error boundary
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [user, firestore]);

  return null;
}
