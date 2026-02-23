'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentData, DocumentSnapshot, doc } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * A real-time Firestore document hook using the real SDK.
 */
export function useDoc<T = DocumentData>(target: string | DocumentReference<T> | null | undefined, docId?: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    let ref: DocumentReference<T> | null = null;
    
    if (typeof target === 'string' && docId && firestore) {
      ref = doc(firestore, target, docId) as DocumentReference<T>;
    } else if (target && typeof target !== 'string') {
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
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: ref?.path || 'unknown/doc',
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [target, docId, firestore]);

  return { data, loading, error, isLoading: loading };
}
