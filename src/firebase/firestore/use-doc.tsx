'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentData, DocumentSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * A real-time Firestore document hook using the real SDK.
 */
export function useDoc<T = DocumentData>(target: string | DocumentReference<T> | null | undefined, docId?: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ref: DocumentReference<T> | null = null;
    
    if (typeof target === 'string' && docId) {
      ref = doc(db, target, docId) as DocumentReference<T>;
    } else if (typeof target !== 'string') {
      ref = target as DocumentReference<T>;
    }

    if (!ref) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as T) : null);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore useDoc Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [target, docId]);

  return { data, loading, error, isLoading: loading };
}
