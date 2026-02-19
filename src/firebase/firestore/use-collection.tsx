'use client';

import { useEffect, useState } from 'react';
import { onSnapshot, Query, DocumentData, collection, query, QuerySnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * A real-time Firestore collection hook using the real SDK.
 * Supports both collection names (strings) and pre-constructed Queries.
 */
export function useCollection<T = DocumentData>(target: string | Query<T> | null | undefined) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!target) {
      setLoading(false);
      setData(null);
      return;
    }

    const q = typeof target === 'string' ? query(collection(db, target)) : target;

    setLoading(true);
    const unsubscribe = onSnapshot(
      q as Query<T>,
      (snapshot: QuerySnapshot<T>) => {
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
  }, [target]);

  return { data, loading, error, isLoading: loading };
}
