'use client';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, getDocs, Query, DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

interface UseCollectionOptions {
    realtime?: boolean;
}

/**
 * A Firestore collection hook using the real SDK.
 * Supports both realtime listeners (default) and one-shot fetches.
 * permission-denied and not-found errors are silenced - these are expected
 * on first load before collections exist.
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

        const q = typeof target === 'string'
            ? query(collection(firestore, target))
            : target;

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
                async (serverError: any) => {
                    // Silently ignore - collection may not exist yet on first load
                    if (
                        serverError?.code === 'permission-denied' ||
                        serverError?.code === 'not-found'
                    ) {
                        setData([]);
                        setLoading(false);
                        return;
                    }
                    const permissionError = new FirestorePermissionError({
                        path: (q as any)._query?.path?.toString() || 'unknown/collection',
                        operation: 'list',
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    setError(permissionError);
                    setLoading(false);
                }
            );
            return () => unsubscribe();
        } else {
            getDocs(q as Query<T>)
                .then((snapshot) => {
                    const docs = snapshot.docs.map((doc) => ({
                        ...(doc.data() as T),
                        id: doc.id,
                    }));
                    setData(docs);
                    setLoading(false);
                })
                .catch(async (serverError: any) => {
                    // Silently ignore - collection may not exist yet on first load
                    if (
                        serverError?.code === 'permission-denied' ||
                        serverError?.code === 'not-found'
                    ) {
                        setData([]);
                        setLoading(false);
                        return;
                    }
                    const permissionError = new FirestorePermissionError({
                        path: (q as any)._query?.path?.toString() || 'unknown/collection',
                        operation: 'list',
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    setError(permissionError);
                    setLoading(false);
                });
        }
    }, [target, firestore, options.realtime]);

    return { data, loading, error, isLoading: loading };
}
