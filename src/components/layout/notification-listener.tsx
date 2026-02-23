'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collectionGroup, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

/**
 * Invisible listener for inbound messages to trigger browser notifications.
 * This is a client-side component because it uses React hooks and Browser APIs.
 */
export function NotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!user || !firestore || typeof window === 'undefined') return;

    // Listen for new inbound messages across all contacts
    const q = query(
      collectionGroup(firestore, 'sms_thread'),
      where('direction', '==', 'inbound'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    });

    return () => unsubscribe();
  }, [user, firestore]);

  return null;
}
