'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, getDocs, Query, DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';

interface UseCollectionOptions {
  realtime?: boolean;
}

/**
 * A Firestore collection hook using the real SDK.
 * Supports both realtime listeners (default) and one-shot fetches.
 */
export function useCollection<T = DocumentData>(
  target: string | Query<T> | null | undefined,
  options: UseCollectionOptions = { realtime: true }
) {
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

    if (options.realtime) {
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
    } else {
      // One-shot fetch for non-critical data
      getDocs(q as Query<T>)
        .then((snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            ...(doc.data() as T),
            id: doc.id,
          }));
          setData(docs);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Firestore useCollection (One-shot) Error:", err);
          setError(err);
          setLoading(false);
        });
    }
  }, [target, firestore, options.realtime]);

  return { data, loading, error, isLoading: loading };
}
