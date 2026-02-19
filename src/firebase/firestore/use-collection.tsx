'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, Query, DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';

/**
 * A real-time Firestore collection hook using the real SDK.
 * Supports both collection path strings and pre-constructed Query objects.
 */
export function useCollection<T = DocumentData>(target: string | Query<T> | null | undefined) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!target || !firestore) {
      setLoading(false);
      setData(null);
      return;
    }

    const q = typeof target === 'string' ? query(collection(firestore, target)) : target;

    setLoading(true);
    const unsubscribe = onSnapshot(
      q as Query<T>,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore useCollection Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [target, firestore]);

  return { data, loading, error, isLoading: loading };
}
